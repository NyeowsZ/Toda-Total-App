import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BatchOptionsModal } from '@/components/terminal/BatchOptionsModal';
import { CaptureStage } from '@/components/terminal/CaptureStage';
import { HistoryTapeView } from '@/components/terminal/HistoryTapeView';
import { KeypadPanel } from '@/components/terminal/KeypadPanel';
import { TotalsStepperView } from '@/components/terminal/TotalsStepperView';
import { ShadowSm, TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import { useTallyTerminal } from '@/hooks/use-tally-terminal';

function PulsingStatusDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: TerminalColors.accent,
        },
      ]}
    />
  );
}

export default function TerminalScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  const {
    state,
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
  } = useTallyTerminal();

  const isLandscape = width >= height;
  // Compact mobile landscape detection (typical phones in landscape are 360-440pt tall)
  const compact = height < 520 || width < 760;

  const isTotalsMode = state.mode === 'TOTALS_STEPPER';
  const isHistoryMode = state.mode === 'HISTORY_TAPE';
  const isCaptureMode = !isTotalsMode && !isHistoryMode;
  const isAmountStep = isCaptureMode && state.step === 'STEP_AMOUNT';

  const N = state.entries.length;
  const lastEntry = N > 0 ? state.entries[N - 1] : null;

  // Footer Mode Status Badge computation
  let badgeBg: string = TerminalColors.primary;
  let badgeText = `#${totalUnits + 1}`;
  let badgeDesc = state.step === 'STEP_BN' ? 'Enter Body No.' : 'Enter Tally (def: 1)';

  if (state.mode === 'INSPECT_EDIT') {
    badgeBg = TerminalColors.accent;
    badgeText = `#${state.cursorIndex} (EDIT)`;
    badgeDesc = state.cursorIndex === 0 ? 'Virtual Head Anchor (#0)' : 'Inline record edit';
  } else if (state.mode === 'INSERT_STREAM') {
    badgeBg = TerminalColors.warning;
    badgeText = `+${state.insertPointer} (INS)`;
    badgeDesc = 'Splice active (shifting subsequent)';
  } else if (state.mode === 'HISTORY_TAPE') {
    badgeBg = TerminalColors.primary;
    badgeText = `Total: ${totalUnits} units`;
    badgeDesc = `${N} ${N === 1 ? 'slip' : 'slips'} logged`;
  } else if (state.mode === 'TOTALS_STEPPER') {
    badgeBg = TerminalColors.success;
    badgeText =
      sparseTotals.length > 0
        ? `${Math.min(state.totalsCursor + 1, sparseTotals.length)} / ${sparseTotals.length}`
        : '0 / 0';
    badgeDesc = 'Totals';
  }

  const showInsertNext =
    state.mode === 'INSPECT_EDIT' || (state.mode === 'HISTORY_TAPE' && state.cursorIndex <= N);
  const showDeleteRow =
    state.mode === 'INSPECT_EDIT' && state.cursorIndex > 0 && state.cursorIndex <= N;
  const showDoneSplice = state.mode === 'INSERT_STREAM';

  // Split pane proportions matching reference: 60/40 standard, 72/28 in Totals mode
  const mainRatio = isTotalsMode ? 0.72 : 0.6;
  const estimatedMainWidth = isLandscape ? width * mainRatio : width;

  return (
    <View
      className="flex-1"
      style={{
        flexDirection: isLandscape ? 'row' : 'column',
        backgroundColor: TerminalColors.surface,
      }}>
      {/* LEFT DISPLAY STAGE (or TOP stage if viewed in portrait fallback) */}
      <View
        style={{
          flex: isLandscape ? (isTotalsMode ? 72 : 60) : 52,
          backgroundColor: TerminalColors.surface,
          justifyContent: 'space-between',
          paddingTop: Math.max(insets.top, compact ? 10 : 18),
          paddingBottom: isLandscape ? Math.max(insets.bottom, compact ? 10 : 16) : 10,
          paddingLeft: Math.max(insets.left, compact ? 14 : 24),
          paddingRight: isLandscape ? (compact ? 14 : 24) : Math.max(insets.right, 14),
        }}>
        {/* TOP BAR: Clean Borderless Past Info + Totals / Batch Controls */}
        <View className="w-full flex-row items-center justify-between pb-2">
          {/* Past Info Container (hidden visually in Totals mode to keep focus pure) */}
          <View
            className="flex-row items-center gap-2.5 flex-1 mr-2"
            style={{ opacity: isTotalsMode ? 0 : 1 }}
            pointerEvents={isTotalsMode ? 'none' : 'auto'}>
            <View className="flex-row items-center gap-2">
              <PulsingStatusDot />
              {lastEntry ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: TerminalFonts.displayBold,
                    fontSize: compact ? 18 : 24,
                    color: TerminalColors.onSurface,
                    fontVariant: ['tabular-nums'],
                  }}>
                  #{lastEntry.bn}{' '}
                  <Text
                    style={{
                      fontFamily: TerminalFonts.bodyRegular,
                      color: TerminalColors.outline,
                    }}>
                    ·
                  </Text>{' '}
                  <Text
                    style={{
                      fontFamily: TerminalFonts.displayBold,
                      color: TerminalColors.success,
                    }}>
                    {lastEntry.amount}
                  </Text>
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: TerminalFonts.displayBold,
                    fontSize: compact ? 17 : 22,
                    color: TerminalColors.outline,
                  }}>
                  None yet
                </Text>
              )}
            </View>

            {/* Confirmed BN Context Chip (visible in STEP_AMOUNT) */}
            {isAmountStep && (
              <View
                className="flex-row items-center gap-1.5 rounded-xl px-2.5 py-1"
                style={{ backgroundColor: 'rgba(226, 232, 240, 0.72)' }}>
                <Text
                  style={{
                    fontFamily: TerminalFonts.bodySemiBold,
                    fontSize: 11,
                    color: TerminalColors.outline,
                  }}>
                  BN
                </Text>
                <Text
                  style={{
                    fontFamily: TerminalFonts.displayBold,
                    fontSize: compact ? 15 : 17,
                    color: TerminalColors.onSurface,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {state.bnBuffer}
                </Text>
              </View>
            )}
          </View>

          {/* Right Header Controls */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={toggleTotals}
              accessibilityRole="button"
              accessibilityLabel={isTotalsMode ? 'Exit Totals' : 'Open Totals'}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: compact ? 12 : 16,
                paddingVertical: compact ? 7 : 9,
                borderRadius: 12,
                backgroundColor: pressed
                  ? TerminalColors.surfaceContainerHigh
                  : TerminalColors.surfaceContainer,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}>
              <MaterialIcons name="analytics" size={compact ? 17 : 19} color={TerminalColors.success} />
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: compact ? 13 : 14,
                  color: TerminalColors.onSurface,
                }}>
                {isTotalsMode ? 'Exit Totals' : 'Totals'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setOptionsModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Batch Options"
              style={({ pressed }) => ({
                width: compact ? 36 : 40,
                height: compact ? 36 : 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed
                  ? TerminalColors.surfaceContainerHigh
                  : TerminalColors.surfaceContainer,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}>
              <MaterialIcons
                name="more-horiz"
                size={compact ? 20 : 22}
                color={TerminalColors.onSurface}
              />
            </Pressable>
          </View>
        </View>

        {/* CENTER STAGE AREA */}
        <View className="flex-1 w-full justify-center items-center overflow-hidden">
          {isHistoryMode ? (
            <HistoryTapeView
              entries={state.entries}
              cursorIndex={state.cursorIndex}
              onSelectRow={selectHistoryRow}
              onResumeEntry={resumeEntry}
              compact={compact}
            />
          ) : isTotalsMode ? (
            <TotalsStepperView
              sparseTotals={sparseTotals}
              totalsCursor={state.totalsCursor}
              compact={compact}
              stageWidth={estimatedMainWidth}
            />
          ) : (
            <CaptureStage
              mode={state.mode}
              step={state.step}
              bnBuffer={state.bnBuffer}
              amountBuffer={state.amountBuffer}
              isDefaultAmount={state.isDefaultAmount}
              compact={compact}
            />
          )}
        </View>

        {/* BOTTOM BAR: Mode Status Badge + Contextual Aux Actions */}
        <View className="w-full flex-row items-center justify-between pt-2">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View
              style={[
                ShadowSm,
                {
                  paddingHorizontal: compact ? 11 : 14,
                  paddingVertical: compact ? 4 : 6,
                  borderRadius: 10,
                  backgroundColor: badgeBg,
                },
              ]}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: TerminalFonts.displayBold,
                  fontSize: compact ? 16 : 21,
                  color: TerminalColors.onPrimary,
                  fontVariant: ['tabular-nums'],
                }}>
                {badgeText}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              className="flex-shrink"
              style={{
                fontFamily: TerminalFonts.bodyMedium,
                fontSize: compact ? 12.5 : 15,
                color: TerminalColors.outline,
              }}>
              {badgeDesc}
            </Text>
          </View>

          {/* Auxiliary Actions (Insert Next, Done, Delete) */}
          <View className="flex-row items-center gap-2">
            {showInsertNext && (
              <Pressable
                onPress={startInsertNext}
                accessibilityRole="button"
                accessibilityLabel="Insert Next"
                style={({ pressed }) => [
                  ShadowSm,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: compact ? 11 : 14,
                    paddingVertical: compact ? 6 : 8,
                    borderRadius: 11,
                    backgroundColor: TerminalColors.accent,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}>
                <MaterialIcons
                  name="add-circle"
                  size={compact ? 16 : 18}
                  color={TerminalColors.onPrimary}
                />
                <Text
                  style={{
                    fontFamily: TerminalFonts.bodyBold,
                    fontSize: compact ? 12 : 13,
                    color: TerminalColors.onPrimary,
                  }}>
                  Insert Next
                </Text>
              </Pressable>
            )}

            {showDoneSplice && (
              <Pressable
                onPress={doneSplice}
                accessibilityRole="button"
                accessibilityLabel="Done Inserting"
                style={({ pressed }) => [
                  ShadowSm,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: compact ? 12 : 15,
                    paddingVertical: compact ? 6 : 8,
                    borderRadius: 11,
                    backgroundColor: TerminalColors.success,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}>
                <MaterialIcons
                  name="check"
                  size={compact ? 16 : 18}
                  color={TerminalColors.onPrimary}
                />
                <Text
                  style={{
                    fontFamily: TerminalFonts.bodyBold,
                    fontSize: compact ? 12 : 13,
                    color: TerminalColors.onPrimary,
                  }}>
                  Done
                </Text>
              </Pressable>
            )}

            {showDeleteRow && (
              <Pressable
                onPress={deleteCurrentEntry}
                accessibilityRole="button"
                accessibilityLabel="Delete Record"
                style={({ pressed }) => [
                  ShadowSm,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: compact ? 11 : 14,
                    paddingVertical: compact ? 6 : 8,
                    borderRadius: 11,
                    backgroundColor: TerminalColors.error,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}>
                <MaterialIcons
                  name="delete"
                  size={compact ? 16 : 18}
                  color={TerminalColors.onPrimary}
                />
                <Text
                  style={{
                    fontFamily: TerminalFonts.bodyBold,
                    fontSize: compact ? 12 : 13,
                    color: TerminalColors.onPrimary,
                  }}>
                  Delete
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* RIGHT FIXED NUMPAD / TOTALS CONTROLS PANEL */}
      <View
        style={{
          flex: isLandscape ? (isTotalsMode ? 28 : 40) : 48,
          backgroundColor: TerminalColors.surfaceContainerHigh,
          paddingTop: isLandscape ? insets.top : 0,
          paddingBottom: insets.bottom,
          paddingRight: insets.right,
          paddingLeft: isLandscape ? 0 : insets.left,
        }}>
        <KeypadPanel
          mode={state.mode}
          compact={compact}
          totalsCursor={state.totalsCursor}
          totalsCount={sparseTotals.length}
          totalsPendingConfirm={state.totalsPendingConfirm}
          onDigit={handleDigit}
          onDel={handleDel}
          onEnter={handleEnter}
          onBack={handleBack}
          onFwd={handleFwd}
          onToggleHistory={toggleHistory}
          onExitTotals={exitTotals}
        />
      </View>

      {/* BATCH OPTIONS MODAL */}
      <BatchOptionsModal
        visible={optionsModalVisible}
        entries={state.entries}
        confirmStepOnNext={state.confirmStepOnNext}
        onClose={() => setOptionsModalVisible(false)}
        onToggleConfirmStep={setConfirmStepOnNext}
        onClearBatch={clearBatch}
      />
    </View>
  );
}
