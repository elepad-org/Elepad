import { MD3LightTheme } from "react-native-paper";
import { COLORS, FONT } from "./base";

// Apply COLORS to the React Native Paper theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.white,
    surfaceVariant: COLORS.backgroundSecondary,
    onSurface: COLORS.text,
    onSurfaceVariant: COLORS.textSecondary,
    onPrimary: COLORS.white,
    onSecondary: COLORS.white,
    error: COLORS.error,
    onError: COLORS.white,
    outline: COLORS.border,
    outlineVariant: COLORS.separator,
    // Custom mappings for Elepad
    text: COLORS.text,
    accent: COLORS.accent,
    success: COLORS.success,
    placeholder: COLORS.textPlaceholder,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: FONT.regular,
    },
    displayLarge: {
      fontFamily: FONT.regular,
      fontSize: 57,
      fontWeight: "400" as const,
      letterSpacing: -0.25,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: FONT.regular,
      fontSize: 45,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: FONT.regular,
      fontSize: 36,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: FONT.regular,
      fontSize: 32,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: FONT.regular,
      fontSize: 28,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: FONT.regular,
      fontSize: 24,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: FONT.regular,
      fontSize: 22,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: FONT.medium,
      fontSize: 16,
      fontWeight: "500" as const,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: FONT.medium,
      fontSize: 14,
      fontWeight: "500" as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: FONT.medium,
      fontSize: 14,
      fontWeight: "500" as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: FONT.medium,
      fontSize: 12,
      fontWeight: "500" as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: FONT.medium,
      fontSize: 11,
      fontWeight: "500" as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    bodyLarge: {
      fontFamily: FONT.regular,
      fontSize: 16,
      fontWeight: "400" as const,
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: FONT.regular,
      fontSize: 14,
      fontWeight: "400" as const,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: FONT.regular,
      fontSize: 12,
      fontWeight: "400" as const,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
  },
};

// Elepad does not currently support dark mode, so we just copy the light theme.
export const darkTheme = {
  ...lightTheme,
};
