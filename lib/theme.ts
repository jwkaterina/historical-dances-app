import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { Colors } from './colors'
import { Fonts } from './fonts'

const fontConfig = {
  displayLarge:    { fontFamily: Fonts.heading,       fontSize: 57, fontWeight: '700' as const, letterSpacing: 0 },
  displayMedium:   { fontFamily: Fonts.heading,       fontSize: 45, fontWeight: '700' as const, letterSpacing: 0 },
  displaySmall:    { fontFamily: Fonts.heading,       fontSize: 36, fontWeight: '700' as const, letterSpacing: 0 },
  headlineLarge:   { fontFamily: Fonts.heading,       fontSize: 32, fontWeight: '700' as const, letterSpacing: 0 },
  headlineMedium:  { fontFamily: Fonts.heading,       fontSize: 28, fontWeight: '700' as const, letterSpacing: 0 },
  headlineSmall:   { fontFamily: Fonts.heading,       fontSize: 24, fontWeight: '700' as const, letterSpacing: 0 },
  titleLarge:      { fontFamily: Fonts.heading,       fontSize: 22, fontWeight: '700' as const, letterSpacing: 0 },
  titleMedium:     { fontFamily: Fonts.bodySemiBold,  fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.15 },
  titleSmall:      { fontFamily: Fonts.bodySemiBold,  fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1 },
  labelLarge:      { fontFamily: Fonts.bodyMedium,    fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1 },
  labelMedium:     { fontFamily: Fonts.bodyMedium,    fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelSmall:      { fontFamily: Fonts.bodyMedium,    fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
  bodyLarge:       { fontFamily: Fonts.body,          fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.15 },
  bodyMedium:      { fontFamily: Fonts.body,          fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25 },
  bodySmall:       { fontFamily: Fonts.body,          fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.4 },
}

export const lightTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    ...fontConfig,
  },
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.primaryForeground,
    primaryContainer: '#e8ddd0',
    onPrimaryContainer: Colors.foreground,
    secondary: '#7d6b56',
    onSecondary: '#ffffff',
    secondaryContainer: Colors.secondary,
    onSecondaryContainer: Colors.foreground,
    tertiary: '#8a6a5a',
    background: Colors.background,
    onBackground: Colors.foreground,
    surface: Colors.card,
    onSurface: Colors.foreground,
    surfaceVariant: Colors.muted,
    onSurfaceVariant: Colors.mutedForeground,
    outline: Colors.border,
    error: Colors.destructive,
    onError: Colors.destructiveForeground,
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: {
    ...MD3DarkTheme.fonts,
    ...fontConfig,
  },
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    onPrimary: '#2d2621',
    primaryContainer: '#4a3a28',
    onPrimaryContainer: '#ece5d8',
    secondary: '#b09880',
    secondaryContainer: '#4a4039',
    background: '#2d2621',
    onBackground: '#ece5d8',
    surface: '#3a322c',
    onSurface: '#ece5d8',
    surfaceVariant: '#4a4039',
    onSurfaceVariant: '#c0b0a0',
    outline: '#4a4039',
    error: '#d4604a',
  },
}
