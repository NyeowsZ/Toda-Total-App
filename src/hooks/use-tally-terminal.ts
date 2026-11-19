import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { TallyEntry, TerminalState } from '@/types/tally';
import { computeSparseTotals, getTotalTallyUnits, triggerHaptic } from '@/utils/tally';

const STORAGE_ENTRIES_KEY = 'linear_tally_batch';
const STORAGE_SETTINGS_KEY = 'linear_tally_settings';

const DEFAULT_ENTRIES: TallyEntry[] = [
  { bn: '611', amount: 5 },
  { bn: '741', amount: 6 },
  { bn: '002', amount: 1 },
];

const INITIAL_STATE: TerminalState = {
  entries: DEFAULT_ENTRIES,
  mode: 'APPEND_STREAM',
  step: 'STEP_BN',
  cursorIndex: DEFAULT_ENTRIES.length + 1,
  insertPointer: 1,
  bnBuffer: '611',
  amountBuffer: '',
  isDefaultAmount: false,
  totalsCursor: 0,
  totalsPendingConfirm: false,
  confirmStepOnNext: true,
};

export function useTallyTerminal() {
  const [state, setState] = useState<TerminalState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate persisted entries & settings on mount
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [savedEntriesRaw, savedSettingsRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_ENTRIES_KEY),
          AsyncStorage.getItem(STORAGE_SETTINGS_KEY),
        ]);

        if (!mounted) return;

        let loadedEntries: TallyEntry[] | null = null;
        if (savedEntriesRaw) {
          const parsed = JSON.parse(savedEntriesRaw);
          if (Array.isArray(parsed)) {
            loadedEntries = parsed
              .filter(
                (item): item is TallyEntry =>
                  item && typeof item.bn === 'string' && typeof item.amount === 'number'
              )
              .map((item) => ({ bn: item.bn, amount: item.amount }));
          }
        }

        let loadedConfirmStep = true;
        if (savedSettingsRaw) {
          const parsedSettings = JSON.parse(savedSettingsRaw);
          if (typeof parsedSettings?.confirmStepOnNext === 'boolean') {
            loadedConfirmStep = parsedSettings.confirmStepOnNext;
          }
        }

        setState((prev) => {
          const entries = loadedEntries !== null ? loadedEntries : prev.entries;
          return {
            ...prev,
            entries,
            cursorIndex: entries.length + 1,
            bnBuffer: loadedEntries !== null ? '' : prev.bnBuffer,
            confirmStepOnNext: loadedConfirmStep,
          };
        });
      } catch {
        // Fallback to initial state if storage fails
      } finally {
        if (mounted) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const persistEntries = useCallback((entries: TallyEntry[]) => {
    void AsyncStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries)).catch(() => {});
  }, []);

  const persistSettings = useCallback((confirmStepOnNext: boolean) => {
    void AsyncStorage.setItem(
      STORAGE_SETTINGS_KEY,
      JSON.stringify({ confirmStepOnNext })
    ).catch(() => {});
  }, []);

  const sparseTotals = useMemo(() => computeSparseTotals(state.entries), [state.entries]);
  const totalUnits = useMemo(() => getTotalTallyUnits(state.entries), [state.entries]);

  const handleDigit = useCallback((digit: string) => {
    triggerHaptic('light');
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        return { ...prev, bnBuffer: prev.bnBuffer + digit };
      }

      if (prev.mode === 'HISTORY_TAPE') {
        // Switch straight into entry stream if operator starts typing digits from history
        return {
          ...prev,
          mode: 'APPEND_STREAM',
          cursorIndex: prev.entries.length + 1,
          step: 'STEP_BN',
          bnBuffer: digit,
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      if (prev.step === 'STEP_BN') {
        if (prev.bnBuffer.length >= 10) return prev;
        return { ...prev, bnBuffer: prev.bnBuffer + digit };
      }

      // STEP_AMOUNT: if untouched default '1', replace immediately with pressed digit
      if (prev.amountBuffer === '1' && prev.isDefaultAmount) {
        return {
          ...prev,
          amountBuffer: digit,
          isDefaultAmount: false,
        };
      }

      if (prev.amountBuffer.length >= 8) return prev;
      return {
        ...prev,
        amountBuffer: prev.amountBuffer + digit,
        isDefaultAmount: false,
      };
    });
  }, []);

  const deleteCurrentEntry = useCallback(() => {
    triggerHaptic('warning');
    setState((prev) => {
      if (prev.cursorIndex < 1 || prev.cursorIndex > prev.entries.length) return prev;
      const nextEntries = [...prev.entries];
      nextEntries.splice(prev.cursorIndex - 1, 1);
      persistEntries(nextEntries);

      const N = nextEntries.length;
      if (N === 0) {
        return {
          ...prev,
          entries: nextEntries,
          mode: 'APPEND_STREAM',
          cursorIndex: 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      const nextCursor = prev.cursorIndex > N ? N : prev.cursorIndex;
      const target = nextEntries[nextCursor - 1];
      return {
        ...prev,
        entries: nextEntries,
        cursorIndex: nextCursor,
        step: 'STEP_BN',
        bnBuffer: target.bn,
        amountBuffer: String(target.amount),
        isDefaultAmount: false,
      };
    });
  }, [persistEntries]);

  const handleDel = useCallback(() => {
    triggerHaptic('light');
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        return { ...prev, bnBuffer: prev.bnBuffer.slice(0, -1) };
      }

      if (prev.mode === 'HISTORY_TAPE') {
        return prev;
      }

      if (prev.step === 'STEP_AMOUNT') {
        if (prev.amountBuffer.length > 0) {
          return {
            ...prev,
            amountBuffer: prev.amountBuffer.slice(0, -1),
            isDefaultAmount: false,
          };
        }
        return { ...prev, step: 'STEP_BN', isDefaultAmount: false };
      }

      // STEP_BN
      if (prev.bnBuffer.length > 0) {
        return { ...prev, bnBuffer: prev.bnBuffer.slice(0, -1) };
      }

      // If empty BN while inspecting an existing record, delete it
      if (
        prev.mode === 'INSPECT_EDIT' &&
        prev.cursorIndex > 0 &&
        prev.cursorIndex <= prev.entries.length
      ) {
        const nextEntries = [...prev.entries];
        nextEntries.splice(prev.cursorIndex - 1, 1);
        persistEntries(nextEntries);
        const N = nextEntries.length;
        if (N === 0) {
          return {
            ...prev,
            entries: nextEntries,
            mode: 'APPEND_STREAM',
            cursorIndex: 1,
            step: 'STEP_BN',
            bnBuffer: '',
            amountBuffer: '',
            isDefaultAmount: false,
          };
        }
        const nextCursor = prev.cursorIndex > N ? N : prev.cursorIndex;
        const target = nextEntries[nextCursor - 1];
        return {
          ...prev,
          entries: nextEntries,
          cursorIndex: nextCursor,
          bnBuffer: target.bn,
          amountBuffer: String(target.amount),
          isDefaultAmount: false,
        };
      }

      return prev;
    });
  }, [persistEntries]);

  const handleEnter = useCallback(() => {
    triggerHaptic('medium');
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        if (prev.bnBuffer) {
          const sparse = computeSparseTotals(prev.entries);
          const target = prev.bnBuffer.trim();
          const idx = sparse.findIndex(
            (row) => row.bn === target || Number(row.bn) === Number(target)
          );
          if (idx !== -1) {
            return {
              ...prev,
              totalsCursor: idx,
              totalsPendingConfirm: false,
              bnBuffer: '',
            };
          }
          return { ...prev, bnBuffer: '' };
        }
        return prev;
      }

      if (prev.mode === 'HISTORY_TAPE') {
        return {
          ...prev,
          mode: 'APPEND_STREAM',
          cursorIndex: prev.entries.length + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      if (prev.step === 'STEP_BN') {
        if (prev.bnBuffer.trim().length === 0) return prev;
        if (prev.mode !== 'INSPECT_EDIT') {
          return {
            ...prev,
            step: 'STEP_AMOUNT',
            amountBuffer: '1',
            isDefaultAmount: true,
          };
        }
        return {
          ...prev,
          step: 'STEP_AMOUNT',
          isDefaultAmount: false,
        };
      }

      // STEP_AMOUNT
      const bufferToParse = prev.amountBuffer.trim() || '1';
      const parsedAmount = parseInt(bufferToParse, 10);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return prev;

      const record: TallyEntry = {
        bn: prev.bnBuffer.trim(),
        amount: parsedAmount,
      };

      if (prev.mode === 'APPEND_STREAM') {
        const nextEntries = [...prev.entries, record];
        persistEntries(nextEntries);
        triggerHaptic('success');
        return {
          ...prev,
          entries: nextEntries,
          cursorIndex: nextEntries.length + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      if (prev.mode === 'INSERT_STREAM') {
        const nextEntries = [...prev.entries];
        const zeroIdx = Math.max(0, Math.min(prev.insertPointer - 1, nextEntries.length));
        nextEntries.splice(zeroIdx, 0, record);
        persistEntries(nextEntries);
        triggerHaptic('success');
        return {
          ...prev,
          entries: nextEntries,
          insertPointer: prev.insertPointer + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      if (prev.mode === 'INSPECT_EDIT') {
        const nextEntries = [...prev.entries];
        if (prev.cursorIndex >= 1 && prev.cursorIndex <= nextEntries.length) {
          nextEntries[prev.cursorIndex - 1] = record;
          persistEntries(nextEntries);
          triggerHaptic('success');
        }
        return {
          ...prev,
          entries: nextEntries,
          mode: 'APPEND_STREAM',
          cursorIndex: nextEntries.length + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      return prev;
    });
  }, [persistEntries]);

  const handleBack = useCallback(() => {
    triggerHaptic('light');
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        if (prev.totalsCursor > 0) {
          return {
            ...prev,
            totalsPendingConfirm: false,
            totalsCursor: prev.totalsCursor - 1,
          };
        }
        return { ...prev, totalsPendingConfirm: false };
      }

      const N = prev.entries.length;
      if (prev.mode === 'APPEND_STREAM' || prev.mode === 'HISTORY_TAPE') {
        if (N > 0) {
          const last = prev.entries[N - 1];
          return {
            ...prev,
            cursorIndex: N,
            mode: 'INSPECT_EDIT',
            step: 'STEP_BN',
            bnBuffer: last.bn,
            amountBuffer: String(last.amount),
            isDefaultAmount: false,
          };
        }
        return prev;
      }

      if (prev.mode === 'INSPECT_EDIT') {
        if (prev.cursorIndex > 0) {
          const nextCursor = prev.cursorIndex - 1;
          if (nextCursor === 0) {
            return {
              ...prev,
              cursorIndex: 0,
              step: 'STEP_BN',
              bnBuffer: '',
              amountBuffer: '',
              isDefaultAmount: false,
            };
          }
          const target = prev.entries[nextCursor - 1];
          return {
            ...prev,
            cursorIndex: nextCursor,
            step: 'STEP_BN',
            bnBuffer: target.bn,
            amountBuffer: String(target.amount),
            isDefaultAmount: false,
          };
        }
      }

      return prev;
    });
  }, []);

  const handleFwd = useCallback(() => {
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        const sparse = computeSparseTotals(prev.entries);
        if (sparse.length === 0) return prev;
        if (prev.confirmStepOnNext && !prev.totalsPendingConfirm) {
          triggerHaptic('success');
          return { ...prev, totalsPendingConfirm: true };
        }
        triggerHaptic('medium');
        const nextCursor =
          prev.totalsCursor < sparse.length - 1 ? prev.totalsCursor + 1 : prev.totalsCursor;
        return {
          ...prev,
          totalsPendingConfirm: false,
          totalsCursor: nextCursor,
        };
      }

      triggerHaptic('light');
      const N = prev.entries.length;
      if (prev.mode === 'INSPECT_EDIT') {
        if (prev.cursorIndex < N) {
          const nextCursor = prev.cursorIndex + 1;
          const target = prev.entries[nextCursor - 1];
          return {
            ...prev,
            cursorIndex: nextCursor,
            step: 'STEP_BN',
            bnBuffer: target.bn,
            amountBuffer: String(target.amount),
            isDefaultAmount: false,
          };
        }
        return {
          ...prev,
          mode: 'APPEND_STREAM',
          cursorIndex: N + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }

      return prev;
    });
  }, []);

  const toggleHistory = useCallback(() => {
    triggerHaptic('light');
    setState((prev) => {
      if (prev.mode === 'HISTORY_TAPE') {
        return {
          ...prev,
          mode: 'APPEND_STREAM',
          cursorIndex: prev.entries.length + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }
      return {
        ...prev,
        mode: 'HISTORY_TAPE',
      };
    });
  }, []);

  const resumeEntry = useCallback(() => {
    triggerHaptic('light');
    setState((prev) => ({
      ...prev,
      mode: 'APPEND_STREAM',
      cursorIndex: prev.entries.length + 1,
      step: 'STEP_BN',
      bnBuffer: '',
      amountBuffer: '',
      isDefaultAmount: false,
    }));
  }, []);

  const toggleTotals = useCallback(() => {
    triggerHaptic('medium');
    setState((prev) => {
      if (prev.mode === 'TOTALS_STEPPER') {
        return {
          ...prev,
          totalsPendingConfirm: false,
          mode: 'APPEND_STREAM',
          cursorIndex: prev.entries.length + 1,
          step: 'STEP_BN',
          bnBuffer: '',
          amountBuffer: '',
          isDefaultAmount: false,
        };
      }
      return {
        ...prev,
        totalsPendingConfirm: false,
        mode: 'TOTALS_STEPPER',
        totalsCursor: 0,
        bnBuffer: '',
        amountBuffer: '',
        isDefaultAmount: false,
      };
    });
  }, []);

  const exitTotals = useCallback(() => {
    triggerHaptic('light');
    setState((prev) => ({
      ...prev,
      totalsPendingConfirm: false,
      mode: 'APPEND_STREAM',
      cursorIndex: prev.entries.length + 1,
      step: 'STEP_BN',
      bnBuffer: '',
      amountBuffer: '',
      isDefaultAmount: false,
    }));
  }, []);

  const selectHistoryRow = useCallback((row1Index: number) => {
    triggerHaptic('light');
    setState((prev) => {
      const entry = prev.entries[row1Index - 1];
      if (!entry) return prev;
      return {
        ...prev,
        cursorIndex: row1Index,
        mode: 'INSPECT_EDIT',
        step: 'STEP_BN',
        bnBuffer: entry.bn,
        amountBuffer: String(entry.amount),
        isDefaultAmount: false,
      };
    });
  }, []);

  const startInsertNext = useCallback(() => {
    triggerHaptic('medium');
    setState((prev) => ({
      ...prev,
      insertPointer: prev.cursorIndex + 1,
      mode: 'INSERT_STREAM',
      step: 'STEP_BN',
      bnBuffer: '',
      amountBuffer: '',
      isDefaultAmount: false,
    }));
  }, []);

  const doneSplice = useCallback(() => {
    triggerHaptic('success');
    setState((prev) => ({
      ...prev,
      mode: 'APPEND_STREAM',
      cursorIndex: prev.entries.length + 1,
      step: 'STEP_BN',
      bnBuffer: '',
      amountBuffer: '',
      isDefaultAmount: false,
    }));
  }, []);

  const setConfirmStepOnNext = useCallback(
    (enabled: boolean) => {
      persistSettings(enabled);
      setState((prev) => ({
        ...prev,
        confirmStepOnNext: enabled,
        totalsPendingConfirm: false,
      }));
    },
    [persistSettings]
  );

  const clearBatch = useCallback(() => {
    triggerHaptic('warning');
    persistEntries([]);
    setState((prev) => ({
      ...prev,
      entries: [],
      mode: 'APPEND_STREAM',
      cursorIndex: 1,
      insertPointer: 1,
      step: 'STEP_BN',
      bnBuffer: '',
      amountBuffer: '',
      isDefaultAmount: false,
      totalsCursor: 0,
      totalsPendingConfirm: false,
    }));
  }, [persistEntries]);

  // Web & external hardware keyboard support
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        handleDigit(event.key);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleEnter();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleDel();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleBack();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleFwd();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBack, handleDel, handleDigit, handleEnter, handleFwd]);

  return {
    state,
    isHydrated,
    sparseTotals,
    totalUnits,
    handleDigit,
    handleDel,
    handleEnter,
    handleBack,
    handleFwd,
    toggleHistory,
    resumeEntry,
    toggleTotals,
    exitTotals,
    selectHistoryRow,
    startInsertNext,
    doneSplice,
    deleteCurrentEntry,
    setConfirmStepOnNext,
    clearBatch,
  };
}
