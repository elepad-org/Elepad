import { useState } from "react";
import { View, Platform } from "react-native";
import { BottomNavigation, useTheme } from "react-native-paper";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";

// ~8% opacity for the active tab indicator background
const ACTIVE_INDICATOR_OPACITY = 0.08;
const activeIndicatorColor = `rgba(0, 122, 255, ${ACTIVE_INDICATOR_OPACITY})`;

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
      key: "recuerdos",
      title: "Recuerdos",
      focusedIcon: "image-multiple",
      unfocusedIcon: "image-multiple-outline",
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
    recuerdos: RecuerdosScreen,
    configuracion: ConfiguracionScreen,
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Content that occupies entire screen */}
      <View
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
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

      {/* Floating navigation bar - Apple-style */}
      <View
        style={{
          position: "absolute",
          bottom: 24,
          left: 20,
          right: 20,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: COLORS.backgroundSecondary,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
            },
            android: {
              elevation: 8,
            },
          }),
          zIndex: 1000,
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
          activeColor={COLORS.primary}
          inactiveColor={COLORS.textLight}
          activeIndicatorStyle={{
            backgroundColor: activeIndicatorColor,
            borderRadius: 12,
          }}
          style={{
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 72,
            justifyContent: "center",
            alignItems: "center",
          }}
          labeled={true}
          labelMaxFontSizeMultiplier={1.2}
          theme={theme}
          safeAreaInsets={{ bottom: 0 }}
        />
      </View>
    </View>
  );
}
