import { MD3LightTheme } from "react-native-paper";
import { COLORS, FONT } from "./base";

// Apple-style iOS inspired theme for React Native Paper
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
  roundness: 2, // Base roundness multiplier for Paper components
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: FONT.regular,
    },
    // Display styles - Large titles
    displayLarge: {
      fontFamily: FONT.bold,
      fontSize: 57,
      fontWeight: "700" as const,
      letterSpacing: -0.5,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: FONT.bold,
      fontSize: 45,
      fontWeight: "700" as const,
      letterSpacing: -0.25,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: FONT.semiBold,
      fontSize: 36,
      fontWeight: "600" as const,
      letterSpacing: -0.25,
      lineHeight: 44,
    },
    // Headline styles - Section headers
    headlineLarge: {
      fontFamily: FONT.semiBold,
      fontSize: 32,
      fontWeight: "600" as const,
      letterSpacing: -0.25,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: FONT.semiBold,
      fontSize: 28,
      fontWeight: "600" as const,
      letterSpacing: -0.15,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: FONT.semiBold,
      fontSize: 24,
      fontWeight: "600" as const,
      letterSpacing: -0.1,
      lineHeight: 32,
    },
    // Title styles - Card headers
    titleLarge: {
      fontFamily: FONT.semiBold,
      fontSize: 22,
      fontWeight: "600" as const,
      letterSpacing: -0.05,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: FONT.medium,
      fontSize: 16,
      fontWeight: "500" as const,
      letterSpacing: 0.1,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: FONT.medium,
      fontSize: 14,
      fontWeight: "500" as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    // Label styles - Buttons and small text
    labelLarge: {
      fontFamily: FONT.semiBold,
      fontSize: 14,
      fontWeight: "600" as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: FONT.medium,
      fontSize: 12,
      fontWeight: "500" as const,
      letterSpacing: 0.3,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: FONT.medium,
      fontSize: 11,
      fontWeight: "500" as const,
      letterSpacing: 0.3,
      lineHeight: 16,
    },
    // Body styles - Content text
    bodyLarge: {
      fontFamily: FONT.regular,
      fontSize: 17,
      fontWeight: "400" as const,
      letterSpacing: -0.02,
      lineHeight: 26,
    },
    bodyMedium: {
      fontFamily: FONT.regular,
      fontSize: 15,
      fontWeight: "400" as const,
      letterSpacing: 0,
      lineHeight: 22,
    },
    bodySmall: {
      fontFamily: FONT.regular,
      fontSize: 13,
      fontWeight: "400" as const,
      letterSpacing: 0.1,
      lineHeight: 18,
    },
  },
};

// Elepad does not currently support dark mode, so we just copy the light theme.
export const darkTheme = {
  ...lightTheme,
};
