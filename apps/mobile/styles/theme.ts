import { MD3LightTheme } from "react-native-paper";

/** The exact names of available font families. */
export const FONT = {
  thin: "Montserrat_100Thin",
  extraLight: "Montserrat_200ExtraLight",
  light: "Montserrat_300Light",
  regular: "Montserrat_400Regular",
  medium: "Montserrat_500Medium",
  semiBold: "Montserrat_600SemiBold",
  bold: "Montserrat_700Bold",
  extraBold: "Montserrat_800ExtraBold",
  black: "Montserrat_900Black",
  lobster: "Lobster_400Regular",
} as const;

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0a7ea4",
    background: "#fff",
    text: "#11181C",
    surface: "#fff",
  },
};

// Elepad does not currently support dark mode, so we just copy the light theme.
export const darkTheme = {
  ...lightTheme,
};
