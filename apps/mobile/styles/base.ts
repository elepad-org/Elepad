import { StyleSheet, Platform } from "react-native";
import { FONT } from "./theme";

// SISTEMA DE COLORES SIMPLIFICADO
export const COLORS = {
  // Colores principales
  primary: "#8998AF",
  secondary: "#5278CD",

  // Fondos
  background: "#F7F3F2",
  backgroundSecondary: "#F8F9FA",
  white: "#ffffff",
  success: "#5278CD",

  // Textos
  text: "#0f172a",
  textSecondary: "#64748b",
  textLight: "#666666",
  textPlaceholder: "#B2AFAE",

  red: "#c82929a6",

  // Estados
  error: "#d32f2f",
  accent: "#F5F1F0",
  // Bordes y líneas
  border: "#b2bed2ff",
  separator: "#111",
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-start",
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
    width: "85%",
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
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
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    borderColor: "transparent", // para evitar borde gris en Android
    borderWidth: 0, // elimina todos los bordes por defecto
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    outlineWidth: 0, // para web
  },
  inputOutline: {
    borderRadius: 20,
    borderColor: "transparent",
    borderWidth: 0,
  },

  // === TEXTOS ===
  heading: {
    fontSize: 20,
    marginTop: 6,
    fontFamily: FONT.semiBold,
    color: COLORS.text,
    textAlign: "center",
  },

  subheading: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: "center",
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
    marginTop: 70,
  },
  logo: {
    width: 255,
    height: 255,
  },
  brand: {
    marginTop: -15,
    fontSize: 65,
    fontFamily: FONT.lobster,
    color: COLORS.text,
    paddingBottom: 8,
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
    fontFamily: FONT.bold,
  },
  googleText: {
    fontSize: 15,
    color: "#333",
    fontFamily: FONT.semiBold,
  },

  // === AVATARES ===
  memberAvatarPlaceholder: {
    width: 47,
    height: 47,
    borderRadius: 40,
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitials: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.white,
  },

  // === TARJETA DE MENÚ ===
  menuCard: {
    marginVertical: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  // === FAMILY GROUP ESPECÍFICOS ===
  titleCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    padding: 16,
    width: "100%",
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  memberInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  paragraphText: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: COLORS.text,
    marginBottom: 2,
  },

  inviteCodeCard: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  inviteCodeTitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 8,
  },
  inviteCodeText: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inviteCodeExpiry: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: COLORS.white,
    textAlign: "center",
    opacity: 0.8,
  },
});
