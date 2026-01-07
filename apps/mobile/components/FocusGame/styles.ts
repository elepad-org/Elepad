import { StyleSheet } from "react-native";
import { COLORS } from "@/styles/base";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    elevation: 2,
    padding: 16,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontSize: 13,
  },
  statValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
  },
  promptBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  promptText: {
    fontSize: 32,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  } as any,
  colorButton: {
    width: "30%",
    height: 64,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  colorLabel: {
    fontWeight: "700",
    fontSize: 16,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  } as any,
  button: {
    flex: 1,
  },
});
