import { useState } from "react";
import { View } from "react-native";
import { BottomNavigation, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "./home";
import ExploreScreen from "./explore";
import JuegosScreen from "./juegos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const [routes] = useState([
    {
      key: "home",
      title: "Inicio",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "calendar",
      title: "Calendario",
      focusedIcon: "calendar-month",
      unfocusedIcon: "calendar-month-outline",
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
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    configuracion: ConfiguracionScreen,
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {renderScene({
          route: routes[index],
          jumpTo: (key: string) => {
            const routeIndex = routes.findIndex((route) => route.key === key);
            if (routeIndex !== -1) {
              setIndex(routeIndex);
            }
          },
        })}
      </View>
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 10,
          left: 16,
          right: 16,
          borderRadius: 30,
          overflow: "hidden",
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
      >
        <BottomNavigation.Bar
          navigationState={{ index, routes }}
          onTabPress={({ route }) => {
            const routeIndex = routes.findIndex((r) => r.key === route.key);
            if (routeIndex !== -1) {
              setIndex(routeIndex);
            }
          }}
          activeColor={theme.colors.onSurface}
          inactiveColor={theme.colors.onSurface}
          activeIndicatorStyle={{
            backgroundColor: COLORS.primary,
          }}
          style={{
            backgroundColor: COLORS.border,
            borderTopWidth: 0,
            elevation: 0,
          }}
          labeled={true}
          labelMaxFontSizeMultiplier={1.4}
          theme={theme}
          safeAreaInsets={{ bottom: 0 }}
        />
      </View>
    </View>
  );
}
