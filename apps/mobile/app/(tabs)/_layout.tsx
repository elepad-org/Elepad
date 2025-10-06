import { useState } from "react";
import { View } from "react-native";
import { BottomNavigation, useTheme } from "react-native-paper";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";

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
    <View style={{ flex: 1 }}>
      {/* Contenido que ocupa toda la pantalla */}
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

      {/* Barra de navegación flotante */}
      <View
        style={{
          position: "absolute",
          bottom: 25,
          left: 16,
          right: 16,
          borderRadius: 28,
          overflow: "hidden",
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          zIndex: 1000, // Asegurar que esté por encima del contenido
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
            height: 77,
            justifyContent: "center",
            alignItems: "center",
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
