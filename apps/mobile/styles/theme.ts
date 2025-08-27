import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { lightBlue100 } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#5278CD",
    secondary: "#FFFFFF",
    background: "#FFF9F1",
    text: "#11181C",
    error: "#B00020",
    surface: "#FFF9F1",
    lightGreen100: "fff",
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: "Montserrat-Regular",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "Montserrat-Medium",
      fontWeight: "normal",
    },
    light: {
      fontFamily: "Montserrat-Light",
      fontWeight: "normal",
    },
    thin: {
      fontFamily: "Montserrat-Thin",
      fontWeight: "normal",
    },
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
};

export const lightTheme = theme;

// For now we won't have a dark theme, but we'll leave this here for future implementation.
export const darkTheme = {
  ...MD3DarkTheme,
  ...theme, // Inherit from the base theme
};
