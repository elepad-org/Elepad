import { StyleSheet, Platform } from "react-native";
import { FONT } from "./theme";

// SISTEMA DE COLORES SIMPLIFICADO
export const COLORS = {
  // Colores principales
  primary: "#5278CD",
  secondary: "#5278CD",

  // Fondos
  background: "#FFF4E3",
  backgroundSecondary: "#F8F9FA",
  white: "#ffffff",

  // Textos
  text: "#0f172a",
  textSecondary: "#64748b",
  textLight: "#666666",
  textPlaceholder: "#B2AFAE",

  red: "#c82929a6",

  // Estados
  success: "green",
  error: "#d32f2f",
  accent: "#f4efe9ff",
  // Bordes y líneas
  border: "#dac8b676",
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
    backgroundColor: COLORS.secondary,
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
    borderColor: COLORS.white, // para evitar borde gris en Android no se la verdad todo un tema
  },
  inputOutline: {
    borderRadius: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitials: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.white,
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

  // === TARJETA DE MENÚ ===
  menuCard: {
    marginVertical: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // === FAMILY GROUP ESPECÍFICOS ===
  familyGroupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.light,
  },
  familyGroupTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    color: COLORS.text,
    flex: 1,
    width: "85%",
    textAlign: "center",
  },
  familyGroupSubtitle: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  familyGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  editButton: {
    padding: 2,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  membersSectionContainer: {
    marginTop: 24,
  },
  membersSectionHeader: {
    marginBottom: 12,
  },
  groupNameEditContainer: {
    alignItems: "center",
    width: "100%",
  },
  groupNameDisplay: {
    alignItems: "center",
    width: "100%",
    padding: 16,
  },
  editButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
    gap: 12,
  },
  membersContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    ...SHADOWS.light,
  },
  memberInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
  },
  memberNameText: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  ownerBadge: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  ownerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  actionButton: {
    marginBottom: 12,
    width: "100%",
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
  backButtonContainer: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
});
