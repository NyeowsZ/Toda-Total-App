import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInRight,
  FadeOutRight,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ShadowSm, TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { CaptureStep, TerminalMode } from '@/types/tally';
import { computeFitFontSize } from '@/utils/tally';

interface CaptureStageProps {
  mode: TerminalMode;
  step: CaptureStep;
  bnBuffer: string;
  amountBuffer: string;
  isDefaultAmount: boolean;
  compact: boolean;
}

function PulsingCaret({ color, height }: { color: string; height: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 480, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) })
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
          width: 5,
          height,
          backgroundColor: color,
          borderRadius: 3,
          marginLeft: 6,
        },
      ]}
    />
  );
}

export function CaptureStage({
  mode,
  step,
  bnBuffer,
  amountBuffer,
  isDefaultAmount,
  compact,
}: CaptureStageProps) {
  const [stageWidth, setStageWidth] = useState(0);
  const isAmountStep = step === 'STEP_AMOUNT';
  const maxDigitSize = compact ? 52 : 68;

  const bnDisplayText = bnBuffer ? `#${bnBuffer}` : '—';
  const amountDisplayText = amountBuffer || '0';

  const effectiveWidth = stageWidth > 0 ? stageWidth : compact ? 340 : 520;
  const dividerSpace = isAmountStep ? (compact ? 24 : 44) : 0;
  const bnSlotAvailWidth = isAmountStep
    ? Math.max(70, (effectiveWidth - dividerSpace) / 2 - 16)
    : Math.max(120, effectiveWidth - 36);
  const amountSlotAvailWidth = Math.max(70, (effectiveWidth - dividerSpace) / 2 - 42);

  const bnFontSize = computeFitFontSize(bnDisplayText, bnSlotAvailWidth, maxDigitSize, 20, 0.72);
  const amountFontSize = computeFitFontSize(
    amountDisplayText,
    amountSlotAvailWidth,
    maxDigitSize,
    20,
    0.72
  );

  const bnCaretHeight = Math.max(20, Math.round(bnFontSize * 0.8));
  const amountCaretHeight = Math.max(20, Math.round(amountFontSize * 0.8));

  const getGuidanceContent = () => {
    if (isAmountStep) {
      if (isDefaultAmount) {
        return (
          <Text
            style={{
              fontFamily: TerminalFonts.bodySemiBold,
              fontSize: compact ? 12 : 13,
              color: TerminalColors.outline,
              textAlign: 'center',
            }}>
            Press{' '}
            <Text
              style={{
                fontFamily: TerminalFonts.bodyBold,
                color: TerminalColors.onSurface,
              }}>
              Enter
            </Text>{' '}
            to accept default{' '}
            <Text
              style={{
                fontFamily: TerminalFonts.bodyBold,
                color: TerminalColors.success,
              }}>
              1
            </Text>
            , or type new count
          </Text>
        );
      }
      return (
        <Text
          style={{
            fontFamily: TerminalFonts.bodySemiBold,
            fontSize: compact ? 12 : 13,
            color: TerminalColors.outline,
            textAlign: 'center',
          }}>
          Enter slip count / quantity, then press Enter
        </Text>
      );
    }

    let message = 'Type body number, then press Enter';
    if (mode === 'INSPECT_EDIT') {
      message = 'Editing existing slip record. Press Enter to change tally.';
    } else if (mode === 'INSERT_STREAM') {
      message = 'Insert new slip into stack. Press Done when finished.';
    }

    return (
      <Text
        style={{
          fontFamily: TerminalFonts.bodySemiBold,
          fontSize: compact ? 12 : 13,
          color: TerminalColors.outline,
          textAlign: 'center',
        }}>
        {message}
      </Text>
    );
  };

  return (
    <View
      className="flex-1 w-full items-center justify-center px-2"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (Math.abs(w - stageWidth) > 2) {
          setStageWidth(w);
        }
      }}>
      {/* Main Unified Transition Container */}
      <Animated.View
        layout={LinearTransition.duration(220)}
        className="w-full max-w-xl flex-row items-center justify-center">
        {/* Body Number Slot */}
        <Animated.View
          layout={LinearTransition.duration(220)}
          className={
            isAmountStep
              ? 'w-1/2 items-center justify-center px-1'
              : 'w-full items-center justify-center px-1'
          }>
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 12,
              letterSpacing: 1.4,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
            {isAmountStep ? 'BODY NUMBER' : 'BODY NO.'}
          </Text>
          <View className="flex-row items-center justify-center">
            <Text
              style={{
                fontFamily: TerminalFonts.displayExtraBold,
                fontSize: bnFontSize,
                lineHeight: Math.round(bnFontSize * 1.15),
                color: TerminalColors.onSurface,
                opacity: bnBuffer ? 1 : 0.35,
                fontVariant: ['tabular-nums'],
                letterSpacing: bnFontSize >= 44 ? -1 : -0.4,
              }}>
              {bnDisplayText}
            </Text>
            {!isAmountStep && (
              <PulsingCaret color={TerminalColors.primary} height={bnCaretHeight} />
            )}
          </View>
        </Animated.View>

        {/* Soft Tonal Vertical Divider + Tally/Amount Slot */}
        {isAmountStep && (
          <>
            <View
              style={{
                width: 2,
                height: compact ? 70 : 96,
                backgroundColor: TerminalColors.surfaceContainerHigh,
                marginHorizontal: compact ? 10 : 20,
                borderRadius: 1,
              }}
            />

            <Animated.View
              entering={FadeInRight.duration(180)}
              exiting={FadeOutRight.duration(140)}
              className="w-1/2 items-center justify-center px-1">
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: 12,
                  letterSpacing: 1.4,
                  color: TerminalColors.success,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                TALLY / QTY
              </Text>
              <View className="flex-row items-center justify-center">
                <View
                  style={
                    isDefaultAmount
                      ? {
                          backgroundColor: TerminalColors.successTint,
                          borderColor: TerminalColors.successRing,
                          borderWidth: 2,
                          borderRadius: 14,
                          paddingHorizontal: 12,
                          paddingVertical: 2,
                          ...ShadowSm,
                        }
                      : {
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }
                  }>
                  <Text
                    style={{
                      fontFamily: TerminalFonts.displayExtraBold,
                      fontSize: amountFontSize,
                      lineHeight: Math.round(amountFontSize * 1.15),
                      color: TerminalColors.success,
                      opacity: amountBuffer ? 1 : 0.35,
                      fontVariant: ['tabular-nums'],
                      letterSpacing: amountFontSize >= 44 ? -1 : -0.4,
                    }}>
                    {amountDisplayText}
                  </Text>
                </View>
                <PulsingCaret color={TerminalColors.success} height={amountCaretHeight} />
              </View>
            </Animated.View>
          </>
        )}
      </Animated.View>

      {/* Contextual Operator Guidance Hint */}
      <View className="mt-3 px-2">{getGuidanceContent()}</View>
    </View>
  );
}
