import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';

import { ShadowMd, ShadowSm, TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { TerminalMode } from '@/types/tally';

interface KeypadPanelProps {
  mode: TerminalMode;
  compact: boolean;
  totalsCursor: number;
  totalsCount: number;
  totalsPendingConfirm: boolean;
  onDigit: (digit: string) => void;
  onDel: () => void;
  onEnter: () => void;
  onBack: () => void;
  onFwd: () => void;
  onToggleHistory: () => void;
  onExitTotals: () => void;
}

interface DigitKeyProps {
  digit: string;
  compact: boolean;
  onPress: (digit: string) => void;
}

function DigitKey({ digit, compact, onPress }: DigitKeyProps) {
  return (
    <Pressable
      onPress={() => onPress(digit)}
      accessibilityRole="button"
      accessibilityLabel={`Digit ${digit}`}
      style={({ pressed }) => [
        ShadowSm,
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: compact ? 14 : 18,
          backgroundColor: pressed ? TerminalColors.surfaceContainer : TerminalColors.surface,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}>
      <Text
        style={{
          fontFamily: TerminalFonts.displayExtraBold,
          fontSize: compact ? 26 : 34,
          color: TerminalColors.onSurface,
          fontVariant: ['tabular-nums'],
        }}>
        {digit}
      </Text>
    </Pressable>
  );
}

interface ActionKeyProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  accessibilityLabel: string;
  compact: boolean;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}

function ActionKey({
  icon,
  label,
  accessibilityLabel,
  compact,
  active = false,
  danger = false,
  onPress,
}: ActionKeyProps) {
  const iconColor = danger
    ? TerminalColors.error
    : active
      ? TerminalColors.onPrimary
      : TerminalColors.outline;
  const labelColor = danger
    ? TerminalColors.error
    : active
      ? TerminalColors.onPrimary
      : TerminalColors.onSurface;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        ShadowSm,
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: compact ? 14 : 18,
          backgroundColor: active
            ? TerminalColors.primary
            : pressed
              ? danger
                ? TerminalColors.errorTint
                : TerminalColors.surfaceContainer
              : TerminalColors.surface,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          gap: compact ? 1 : 2,
        },
      ]}>
      <MaterialIcons name={icon} size={compact ? 20 : 24} color={iconColor} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: TerminalFonts.bodySemiBold,
          fontSize: compact ? 10.5 : 12,
          color: labelColor,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function KeypadPanel({
  mode,
  compact,
  totalsCursor,
  totalsCount,
  totalsPendingConfirm,
  onDigit,
  onDel,
  onEnter,
  onBack,
  onFwd,
  onToggleHistory,
  onExitTotals,
}: KeypadPanelProps) {
  if (mode === 'TOTALS_STEPPER') {
    const progressLabel =
      totalsCount > 0 ? `${Math.min(totalsCursor + 1, totalsCount)} / ${totalsCount}` : '0 / 0';

    return (
      <View
        className="flex-1 justify-between"
        style={{
          padding: compact ? 12 : 18,
          gap: compact ? 10 : 14,
          backgroundColor: TerminalColors.surfaceContainerHigh,
        }}>
        {/* Progress Header */}
        <View className="flex-row items-center justify-between px-1 pt-0.5">
          <Text
            style={{
              fontFamily: TerminalFonts.bodySemiBold,
              fontSize: compact ? 11 : 12,
              letterSpacing: 0.9,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
            }}>
            PROGRESS
          </Text>
          <Text
            style={{
              fontFamily: TerminalFonts.displayBold,
              fontSize: compact ? 18 : 22,
              color: TerminalColors.onSurface,
              fontVariant: ['tabular-nums'],
            }}>
            {progressLabel}
          </Text>
        </View>

        {/* Stepper Stack */}
        <View className="flex-1 justify-center" style={{ gap: compact ? 8 : 12 }}>
          {/* Dominant Primary Next / Confirm Button */}
          <Pressable
            onPress={onFwd}
            accessibilityRole="button"
            accessibilityLabel={totalsPendingConfirm ? 'Confirm and Advance' : 'Next Body Number'}
            style={({ pressed }) => [
              ShadowMd,
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: compact ? 20 : 24,
                backgroundColor: totalsPendingConfirm
                  ? TerminalColors.success
                  : TerminalColors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                paddingVertical: compact ? 10 : 18,
              },
            ]}>
            <MaterialIcons
              name={totalsPendingConfirm ? 'check' : 'arrow-forward'}
              size={compact ? 42 : 56}
              color={TerminalColors.onPrimary}
            />
            <Text
              style={{
                fontFamily: TerminalFonts.displayBold,
                fontSize: compact ? 20 : 26,
                color: TerminalColors.onPrimary,
                marginTop: compact ? 4 : 8,
              }}>
              Next
            </Text>
          </Pressable>

          {/* Secondary Previous Button */}
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Previous Body Number"
            style={({ pressed }) => [
              ShadowSm,
              {
                height: compact ? 52 : 72,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: compact ? 14 : 18,
                backgroundColor: pressed
                  ? TerminalColors.surfaceContainer
                  : TerminalColors.surface,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}>
            <MaterialIcons
              name="arrow-back"
              size={compact ? 20 : 24}
              color={TerminalColors.outline}
            />
            <Text
              style={{
                fontFamily: TerminalFonts.bodyBold,
                fontSize: compact ? 13 : 15,
                color: TerminalColors.onSurface,
              }}>
              Previous
            </Text>
          </Pressable>
        </View>

        {/* Exit Totals Button */}
        <Pressable
          onPress={onExitTotals}
          accessibilityRole="button"
          accessibilityLabel="Exit Totals"
          style={({ pressed }) => [
            ShadowSm,
            {
              height: compact ? 44 : 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: compact ? 14 : 18,
              backgroundColor: pressed ? TerminalColors.surfaceContainer : TerminalColors.surface,
              borderWidth: 1,
              borderColor: TerminalColors.outlineMuted,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}>
          <MaterialIcons name="logout" size={compact ? 17 : 20} color={TerminalColors.outline} />
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: compact ? 13 : 14,
              color: TerminalColors.onSurface,
            }}>
            Exit Totals
          </Text>
        </Pressable>
      </View>
    );
  }

  const gridGap = compact ? 7 : 10;

  return (
    <View
      className="flex-1"
      style={{
        padding: compact ? 10 : 16,
        gap: gridGap,
        backgroundColor: TerminalColors.surfaceContainerHigh,
      }}>
      {/* ROW 1: History, 7 | 8, 9 */}
      <View className="flex-1 flex-row" style={{ gap: gridGap }}>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <ActionKey
            icon="history"
            label="History"
            accessibilityLabel="History Log"
            compact={compact}
            active={mode === 'HISTORY_TAPE'}
            onPress={onToggleHistory}
          />
          <DigitKey digit="7" compact={compact} onPress={onDigit} />
        </View>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <DigitKey digit="8" compact={compact} onPress={onDigit} />
          <DigitKey digit="9" compact={compact} onPress={onDigit} />
        </View>
      </View>

      {/* ROW 2: Next, 4 | 5, 6 */}
      <View className="flex-1 flex-row" style={{ gap: gridGap }}>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <ActionKey
            icon="fast-forward"
            label="Next"
            accessibilityLabel="Step Forward"
            compact={compact}
            onPress={onFwd}
          />
          <DigitKey digit="4" compact={compact} onPress={onDigit} />
        </View>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <DigitKey digit="5" compact={compact} onPress={onDigit} />
          <DigitKey digit="6" compact={compact} onPress={onDigit} />
        </View>
      </View>

      {/* ROW 3: Prev, 1 | 2, 3 */}
      <View className="flex-1 flex-row" style={{ gap: gridGap }}>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <ActionKey
            icon="fast-rewind"
            label="Prev"
            accessibilityLabel="Step Back"
            compact={compact}
            onPress={onBack}
          />
          <DigitKey digit="1" compact={compact} onPress={onDigit} />
        </View>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <DigitKey digit="2" compact={compact} onPress={onDigit} />
          <DigitKey digit="3" compact={compact} onPress={onDigit} />
        </View>
      </View>

      {/* ROW 4: Clear, 0 | Enter (spans columns 3 & 4 identically) */}
      <View className="flex-1 flex-row" style={{ gap: gridGap }}>
        <View className="flex-1 flex-row" style={{ gap: gridGap }}>
          <ActionKey
            icon="backspace"
            label="Clear"
            accessibilityLabel="Backspace or Delete"
            compact={compact}
            danger
            onPress={onDel}
          />
          <DigitKey digit="0" compact={compact} onPress={onDigit} />
        </View>
        <Pressable
          onPress={onEnter}
          accessibilityRole="button"
          accessibilityLabel="Enter"
          style={({ pressed }) => [
            ShadowMd,
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 6 : 8,
              borderRadius: compact ? 14 : 18,
              backgroundColor: pressed ? TerminalColors.primaryPressed : TerminalColors.primary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}>
          <Text
            style={{
              fontFamily: TerminalFonts.displayBold,
              fontSize: compact ? 20 : 24,
              color: TerminalColors.onPrimary,
            }}>
            Enter
          </Text>
          <MaterialIcons
            name="keyboard-return"
            size={compact ? 19 : 22}
            color={TerminalColors.onPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}
