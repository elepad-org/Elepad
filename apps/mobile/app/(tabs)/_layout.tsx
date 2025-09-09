import { useState } from "react";
import { BottomNavigation, useTheme } from "react-native-paper";
import HomeScreen from "./home";
import ExploreScreen from "./explore";
import JuegosScreen from "./juegos";
import ConfiguracionScreen from "./configuracion";

export default function TabLayout() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    {
      key: "home",
      title: "Inicio",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "explore",
      title: "Explorar",
      focusedIcon: "compass",
      unfocusedIcon: "compass-outline",
    },
    {
      key: "juegos",
      title: "Juegos",
      focusedIcon: "puzzle",
      unfocusedIcon: "puzzle-outline",
    },
    {
      key: "configuracion",
      title: "Config.",
      focusedIcon: "cog",
      unfocusedIcon: "cog-outline",
    },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    explore: ExploreScreen,
    juegos: JuegosScreen,
    configuracion: ConfiguracionScreen,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
        elevation: 8,
      }}
      labeled={true}
      labelMaxFontSizeMultiplier={1.4}
      theme={theme}
    />
  );
}
