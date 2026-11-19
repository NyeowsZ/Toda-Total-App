import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { SparseTotal, TallyEntry } from '@/types/tally';

export function computeSparseTotals(entries: TallyEntry[]): SparseTotal[] {
  const map = new Map<string, SparseTotal>();

  for (const entry of entries) {
    const key = (entry.bn || '').trim();
    if (!key) continue;
    const amount = Number(entry.amount) || 0;
    const existing = map.get(key);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      map.set(key, { bn: key, total: amount, count: 1 });
    }
  }

  return Array.from(map.values())
    .filter((row) => row.total > 0)
    .sort((a, b) => Number(a.bn) - Number(b.bn));
}

export function getTotalTallyUnits(entries: TallyEntry[]): number {
  return entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export function buildCsvContent(entries: TallyEntry[]): string {
  const rows: (string | number)[][] = [['Index', 'BodyNo', 'Amount']];
  entries.forEach((entry, idx) => {
    rows.push([idx + 1, entry.bn, entry.amount]);
  });
  return rows.map((row) => row.join(',')).join('\n');
}

export function buildJsonContent(entries: TallyEntry[]): string {
  return JSON.stringify(
    {
      entries,
      totals: computeSparseTotals(entries),
    },
    null,
    2
  );
}

export async function exportBatchFile(
  filename: string,
  content: string,
  mimeType: string
): Promise<{ ok: boolean; message: string }> {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { ok: true, message: `Downloaded ${filename}` };
    }

    const file = new File(Paths.cache, filename);
    file.write(content);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: `Export ${filename}`,
      });
      return { ok: true, message: `Shared ${filename}` };
    }

    return { ok: true, message: `Saved ${filename} to cache` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch {
    // Ignore haptics errors on unsupported devices
  }
}
