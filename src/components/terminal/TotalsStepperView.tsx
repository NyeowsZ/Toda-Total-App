import { Text, View } from 'react-native';

import { TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { SparseTotal } from '@/types/tally';

interface TotalsStepperViewProps {
  sparseTotals: SparseTotal[];
  totalsCursor: number;
  compact: boolean;
  stageWidth: number;
}

export function TotalsStepperView({
  sparseTotals,
  totalsCursor,
  compact,
  stageWidth,
}: TotalsStepperViewProps) {
  const safeCursor =
    sparseTotals.length > 0
      ? Math.max(0, Math.min(totalsCursor, sparseTotals.length - 1))
      : 0;
  const current = sparseTotals[safeCursor] ?? null;

  // Scale massive display typography smoothly for mobile landscape phones & larger screens
  const giantFontSize = compact
    ? Math.max(58, Math.min(86, Math.floor(stageWidth * 0.165)))
    : Math.max(84, Math.min(132, Math.floor(stageWidth * 0.19)));
  const dividerHeight = compact ? 110 : 168;

  return (
    <View className="flex-1 w-full items-center justify-center px-2">
      <View className="w-full max-w-3xl flex-row items-center justify-around">
        {/* Body Number Column */}
        <View className="flex-1 items-center justify-center px-2">
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: compact ? 12 : 14,
              letterSpacing: 1.8,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
              marginBottom: compact ? 8 : 14,
            }}>
            BODY NUMBER
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={{
              fontFamily: TerminalFonts.displayExtraBold,
              fontSize: giantFontSize,
              lineHeight: giantFontSize * 1.06,
              color: TerminalColors.onSurface,
              fontVariant: ['tabular-nums'],
              letterSpacing: -2,
            }}>
            {current ? `#${current.bn}` : '—'}
          </Text>
        </View>

        {/* Soft Vertical Divider */}
        <View
          style={{
            width: 2,
            height: dividerHeight,
            backgroundColor: TerminalColors.surfaceContainerHigh,
            marginHorizontal: compact ? 12 : 28,
            borderRadius: 1,
          }}
        />

        {/* Total Tally Column */}
        <View className="flex-1 items-center justify-center px-2">
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: compact ? 12 : 14,
              letterSpacing: 1.8,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
              marginBottom: compact ? 8 : 14,
            }}>
            TOTAL TALLY
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={{
              fontFamily: TerminalFonts.displayExtraBold,
              fontSize: giantFontSize,
              lineHeight: giantFontSize * 1.06,
              color: TerminalColors.success,
              fontVariant: ['tabular-nums'],
              letterSpacing: -2,
            }}>
            {current ? String(current.total) : '0'}
          </Text>
        </View>
      </View>
    </View>
  );
}
