import { useState } from 'react';
import { Text, View } from 'react-native';

import { TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { SparseTotal } from '@/types/tally';
import { computeFitFontSize } from '@/utils/tally';

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
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  const safeCursor =
    sparseTotals.length > 0
      ? Math.max(0, Math.min(totalsCursor, sparseTotals.length - 1))
      : 0;
  const current = sparseTotals[safeCursor] ?? null;

  const bnText = current ? `#${current.bn}` : '—';
  const sumText = current ? String(current.total) : '0';

  const effectiveWidth = layoutSize.width > 0 ? layoutSize.width : Math.max(240, stageWidth - 28);
  const dividerMargin = compact ? 10 : 24;
  const columnPadding = 12;
  const columnAvailWidth = Math.max(
    72,
    (effectiveWidth - (dividerMargin * 2 + 2)) / 2 - columnPadding * 2
  );

  // Cap max font size by both viewport tier and measured stage height so digits never clip vertically
  const heightCap =
    layoutSize.height > 0 ? Math.floor(layoutSize.height * 0.48) : compact ? 84 : 128;
  const maxFontSize = Math.min(compact ? 88 : 132, Math.max(36, heightCap));

  const bnFontSize = computeFitFontSize(bnText, columnAvailWidth, maxFontSize, 20, 0.72);
  const sumFontSize = computeFitFontSize(sumText, columnAvailWidth, maxFontSize, 20, 0.72);

  // Use a unified size when both are short so the two columns feel balanced,
  // while still letting either side shrink gracefully if very long
  const balancedFontSize = Math.min(bnFontSize, sumFontSize);
  const displayFontSize =
    Math.abs(bnFontSize - sumFontSize) <= 18 ? balancedFontSize : undefined;

  const finalBnSize = displayFontSize ?? bnFontSize;
  const finalSumSize = displayFontSize ?? sumFontSize;

  const dividerHeight =
    layoutSize.height > 0
      ? Math.max(64, Math.min(compact ? 116 : 168, Math.floor(layoutSize.height * 0.62)))
      : compact
        ? 96
        : 156;

  return (
    <View
      className="flex-1 w-full items-center justify-center px-1"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - layoutSize.width) > 2 || Math.abs(height - layoutSize.height) > 2) {
          setLayoutSize({ width, height });
        }
      }}>
      <View className="w-full max-w-3xl flex-row items-center justify-around">
        {/* Body Number Column */}
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: columnPadding }}>
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: compact ? 11 : 14,
              letterSpacing: 1.6,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
              marginBottom: compact ? 6 : 14,
              textAlign: 'center',
            }}>
            BODY NUMBER
          </Text>
          <Text
            style={{
              fontFamily: TerminalFonts.displayExtraBold,
              fontSize: finalBnSize,
              lineHeight: Math.round(finalBnSize * 1.1),
              color: TerminalColors.onSurface,
              fontVariant: ['tabular-nums'],
              letterSpacing: finalBnSize >= 64 ? -1.5 : -0.5,
              textAlign: 'center',
            }}>
            {bnText}
          </Text>
        </View>

        {/* Soft Vertical Divider */}
        <View
          style={{
            width: 2,
            height: dividerHeight,
            backgroundColor: TerminalColors.surfaceContainerHigh,
            marginHorizontal: dividerMargin,
            borderRadius: 1,
          }}
        />

        {/* Total Tally Column */}
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: columnPadding }}>
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: compact ? 11 : 14,
              letterSpacing: 1.6,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
              marginBottom: compact ? 6 : 14,
              textAlign: 'center',
            }}>
            TOTAL TALLY
          </Text>
          <Text
            style={{
              fontFamily: TerminalFonts.displayExtraBold,
              fontSize: finalSumSize,
              lineHeight: Math.round(finalSumSize * 1.1),
              color: TerminalColors.success,
              fontVariant: ['tabular-nums'],
              letterSpacing: finalSumSize >= 64 ? -1.5 : -0.5,
              textAlign: 'center',
            }}>
            {sumText}
          </Text>
        </View>
      </View>
    </View>
  );
}
