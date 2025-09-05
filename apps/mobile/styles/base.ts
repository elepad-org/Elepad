import { StyleSheet, Platform } from "react-native";
import { FONT } from "./theme";

// SISTEMA DE COLORES SIMPLIFICADO
export const COLORS = {
  // Colores principales
  primary: "#7fb3d3",
  secondary: "#5278CD",

  // Fondos
  background: "#F4F7FF",
  loginBackground: "#FFF9F1",
  white: "#ffffff",

  // Textos
  text: "#0f172a",
  textSecondary: "#64748b",
  textLight: "#666666",
  textPlaceholder: "#B2AFAE",

  // Estados
  success: "green",
  error: "#d32f2f",

  // Bordes y líneas
  border: "#E6E3E0",
  separator: "#111",

  // Específicos
  googleIcon: "#DB4437",
};

// SOMBRAS SIMPLIFICADAS
export const SHADOWS = {
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
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};

// ESTILOS BASE MINIMALISTAS - SOLO LO ESENCIAL
export const styles = StyleSheet.create({
  // === LAYOUTS BÁSICOS ===
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeAreaLogin: {
    flex: 1,
    backgroundColor: COLORS.loginBackground,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // === TARJETAS ===
  card: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
  },

  // === BOTONES ===
  buttonPrimary: {
    marginTop: 20,
    width: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
  },
  buttonSecondary: {
    marginTop: 14,
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    ...SHADOWS.medium,
  },
  buttonContent: {
    height: 48,
  },
  buttonGoogle: {
    marginTop: 14,
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },

  // === INPUTS ===
  input: {
    width: "100%",
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  inputOutline: {
    borderRadius: 8,
  },

  // === TEXTOS ===
  heading: {
    fontSize: 18,
    marginTop: 6,
    fontFamily: FONT.semiBold,
    color: COLORS.text,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    fontFamily: FONT.semiBold,
  },
  footerText: {
    marginTop: 18,
    color: COLORS.textPlaceholder,
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },

  // === LOGO ===
  logoWrap: {
    alignItems: "center",
  },
  logoWrapWithMargin: {
    alignItems: "center",
    marginTop: 115,
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
    color: COLORS.text,
  },
  brandMedium: {
    marginTop: 20,
    fontSize: 44,
    letterSpacing: 8,
    fontFamily: FONT.medium,
    color: COLORS.text,
  },

  // === SEPARADORES ===
  separatorWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  separator: {
    width: "60%",
    height: 1,
    backgroundColor: COLORS.separator,
    opacity: 0.9,
  },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: 12,
    color: "#999",
  },

  // === GOOGLE BUTTON ===
  googleIconWrap: {
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
  googleIcon: {
    color: COLORS.googleIcon,
    fontFamily: FONT.bold,
  },
  googleText: {
    fontSize: 15,
    color: "#333",
    fontFamily: FONT.semiBold,
  },

  // === HEADERS ===
  headerPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: "12%",
    paddingBottom: "20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontFamily: FONT.regular,
    color: COLORS.white,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginTop: 2,
  },

  // === AVATARES ===
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitials: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: COLORS.primary,
  },

  // === DESARROLLO/MANTENIMIENTO ===
  contentWithCurves: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -40,
    paddingTop: 10,
  },
  developmentContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  maintenanceImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  developmentCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    elevation: 3,
  },
  developmentTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    textAlign: "center",
    color: COLORS.primary,
    marginBottom: 16,
  },
  developmentText: {
    fontSize: 16,
    fontFamily: FONT.regular,
    textAlign: "center",
    lineHeight: 24,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  developmentSubtext: {
    fontSize: 14,
    fontFamily: FONT.medium,
    textAlign: "center",
    color: COLORS.primary,
  },
});
