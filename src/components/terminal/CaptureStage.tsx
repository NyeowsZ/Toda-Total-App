import { useEffect } from 'react';
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
  const isAmountStep = step === 'STEP_AMOUNT';
  const digitFontSize = compact ? 52 : 68;
  const digitLineHeight = compact ? 60 : 78;
  const caretHeight = compact ? 42 : 54;

  const bnDisplayText = bnBuffer ? `#${bnBuffer}` : '—';
  const amountDisplayText = amountBuffer || '0';

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
    <View className="flex-1 w-full items-center justify-center px-3">
      {/* Main Unified Transition Container */}
      <Animated.View
        layout={LinearTransition.duration(220)}
        className="w-full max-w-xl flex-row items-center justify-center">
        {/* Body Number Slot */}
        <Animated.View
          layout={LinearTransition.duration(220)}
          className={isAmountStep ? 'w-1/2 items-center justify-center' : 'w-full items-center justify-center'}>
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
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: TerminalFonts.displayExtraBold,
                fontSize: digitFontSize,
                lineHeight: digitLineHeight,
                color: TerminalColors.onSurface,
                opacity: bnBuffer ? 1 : 0.35,
                fontVariant: ['tabular-nums'],
                letterSpacing: -1,
              }}>
              {bnDisplayText}
            </Text>
            {!isAmountStep && (
              <PulsingCaret color={TerminalColors.primary} height={caretHeight} />
            )}
          </View>
        </Animated.View>

        {/* Soft Tonal Vertical Divider + Tally/Amount Slot */}
        {isAmountStep && (
          <>
            <View
              style={{
                width: 2,
                height: compact ? 74 : 96,
                backgroundColor: TerminalColors.surfaceContainerHigh,
                marginHorizontal: compact ? 14 : 24,
                borderRadius: 1,
              }}
            />

            <Animated.View
              entering={FadeInRight.duration(180)}
              exiting={FadeOutRight.duration(140)}
              className="w-1/2 items-center justify-center">
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
                          paddingHorizontal: 14,
                          paddingVertical: 2,
                          ...ShadowSm,
                        }
                      : {
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }
                  }>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      fontFamily: TerminalFonts.displayExtraBold,
                      fontSize: digitFontSize,
                      lineHeight: digitLineHeight,
                      color: TerminalColors.success,
                      opacity: amountBuffer ? 1 : 0.35,
                      fontVariant: ['tabular-nums'],
                      letterSpacing: -1,
                    }}>
                    {amountDisplayText}
                  </Text>
                </View>
                <PulsingCaret color={TerminalColors.success} height={caretHeight} />
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
