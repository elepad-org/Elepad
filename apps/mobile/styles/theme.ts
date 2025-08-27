import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
} from "react-native-paper";

// map your font files (use exact family names you loaded)
const font = {
  regular: "Montserrat_400",
  medium: "Montserrat-Medium",
  light: "Montserrat-Light",
  thin: "Montserrat-Thin",
};

const md3FontConfig = {
  // You don’t need to override every key; override the ones you care about
  bodyLarge: { fontFamily: font.regular },
  bodyMedium: { fontFamily: font.regular },
  bodySmall: { fontFamily: font.regular },

  titleLarge: { fontFamily: font.medium },
  titleMedium: { fontFamily: font.medium },
  titleSmall: { fontFamily: font.medium },

  labelLarge: { fontFamily: font.medium },
  labelMedium: { fontFamily: font.medium },
  labelSmall: { fontFamily: font.regular },

  // (optional) if you use big headings:
  headlineLarge: { fontFamily: font.light },
  displayMedium: { fontFamily: font.light },
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: md3FontConfig }),
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
  fonts: configureFonts({ config: md3FontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#fff",
    background: "#151718",
    text: "#ECEDEE",
    surface: "#151718",
  },
};
