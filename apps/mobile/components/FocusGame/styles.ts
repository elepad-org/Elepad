import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 12,
  },
  promptBox: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  promptText: {
    fontSize: 28,
    fontWeight: "700",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  } as any,
  colorButton: {
    width: "30%",
    height: 56,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  colorLabel: {
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  } as any,
});
