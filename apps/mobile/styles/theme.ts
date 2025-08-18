import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

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

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#fff",
    background: "#151718",
    text: "#ECEDEE",
    surface: "#151718",
  },
};
