import type { ViewStyle } from 'react-native';

export const TerminalColors = {
  accent: '#B45309',
  accentTint: 'rgba(180, 83, 9, 0.14)',
  success: '#047857',
  successTint: 'rgba(4, 120, 87, 0.14)',
  successRing: 'rgba(4, 120, 87, 0.45)',
  warning: '#B45309',
  error: '#B91C1C',
  errorTint: 'rgba(185, 28, 28, 0.10)',
  primary: '#0F172A',
  primaryPressed: '#1E293B',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  onSurface: '#0F172A',
  surfaceContainer: '#F8FAFC',
  surfaceContainerHigh: '#E2E8F0',
  outline: '#475569',
  outlineMuted: 'rgba(71, 85, 105, 0.22)',
  backdrop: 'rgba(15, 23, 42, 0.45)',
} as const;

export const TerminalFonts = {
  displaySemiBold: 'Mulish_600SemiBold',
  displayBold: 'Mulish_700Bold',
  displayExtraBold: 'Mulish_800ExtraBold',
  displayBlack: 'Mulish_900Black',
  bodyRegular: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemiBold: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

export const ShadowSm: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius: 2,
  elevation: 1,
};

export const ShadowMd: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.14,
  shadowRadius: 5,
  elevation: 3,
};
