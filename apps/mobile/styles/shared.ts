import { StyleSheet } from "react-native";
import { FONT } from "./theme";

// Define common colors to be used across the app
export const COLORS = {
  primary: "#7fb3d3",
  primaryDark: "#0a7ea4",
  secondary: "#5278CD",
  background: "#F4F7FF",
  white: "#ffffff",
  offWhite: "#f9f9f9ff",
  loginBackground: "#FFF9F1",
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    tertiary: "#666666",
    light: "#B2AFAE",
  },
  border: "#E6E3E0",
  success: "green",
  error: "#d32f2f",
  google: {
    icon: "#DB4437",
  },
};

// Define common sizes for consistent spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Define common border radius values
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  round: 24,
};

// Define shadows for different platforms
export const createShadow = (
  intensity: "light" | "medium" | "strong" = "medium",
) => {
  const shadowValues = {
    light: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    strong: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  };

  return shadowValues[intensity];
};

// Create common styles that can be used across all screens
export const commonStyles = StyleSheet.create({
  // Layout styles
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeAreaLogin: {
    flex: 1,
    backgroundColor: COLORS.loginBackground,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    justifyContent: "flex-start",
  },
  footer: {
    marginTop: SPACING.lg,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    ...createShadow("medium"),
  },
  menuCard: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    marginTop: SPACING.sm,
  },

  // Button styles
  bottomButton: {
    borderRadius: RADIUS.md,
  },
  bottomButtonContent: {
    height: 48,
  },
  continueButton: {
    marginTop: SPACING.md,
    width: "100%",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary,
  },
  continueContent: {
    height: 48,
  },
  continueLabel: {
    fontSize: 16,
    fontFamily: FONT.semiBold,
  },

  // Input styles
  input: {
    width: "100%",
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
  },
  inputOutline: {
    borderRadius: RADIUS.sm,
  },

  // Text styles
  heading: {
    fontSize: 18,
    marginTop: 6,
    fontFamily: FONT.semiBold,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginTop: SPACING.sm,
    textAlign: "center",
    fontFamily: FONT.semiBold,
  },
  subtitle: {
    color: COLORS.text.secondary,
    textAlign: "center",
  },

  // Member styles
  membersSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...createShadow("light"),
  },
  membersTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    paddingLeft: 10,
    marginBottom: 10,
    color: COLORS.text.primary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitials: {
    color: COLORS.white,
    fontWeight: "700",
  },
  memberName: {
    fontSize: 15,
    color: COLORS.text.primary,
  },

  // Snackbar styles
  successSnackbar: {
    backgroundColor: COLORS.success,
  },

  // Link styles
  inlineBack: {
    textAlign: "center",
    fontFamily: FONT.regular,
    fontSize: 14,
    paddingVertical: 22,
    color: COLORS.text.tertiary,
  },

  // Group header styles
  groupHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    ...createShadow("medium"),
  },
  groupHeaderSubtitle: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  groupHeaderTitle: {
    fontFamily: FONT.bold,
    fontSize: 20,
    color: COLORS.text.primary,
    textAlign: "center",
    flex: 1,
  },

  // Login styles
  logoWrap: {
    alignItems: "center",
  },
  logo: {
    width: 185,
    height: 185,
  },
  brand: {
    marginTop: 20,
    fontSize: 44,
    letterSpacing: 8,
    fontFamily: "JosefinSans-Variable",
  },
  separatorWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  separator: {
    width: "60%",
    height: 1,
    backgroundColor: "#111",
    opacity: 0.9,
  },
  loginCard: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: SPACING.md,
    color: "#999",
  },
  googleButton: {
    marginTop: 14,
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...createShadow("medium"),
  },
  gIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  gIcon: {
    color: COLORS.google.icon,
    fontFamily: FONT.bold,
  },
  googleText: {
    fontSize: 15,
    color: "#333",
    fontFamily: FONT.semiBold,
  },
  footerText: {
    marginTop: 18,
    color: COLORS.text.light,
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },

  // Additional styles
  nameContainer: {
    alignItems: "center",
    width: "100%",
  },
  nameRowContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 32,
  },
  editIcon: {
    margin: 0,
    padding: 0,
    position: "absolute",
    right: -7,
    height: 36,
    width: 36,
  },
  editContainer: {
    width: "100%",
  },
  nameInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.sm,
  },
});
