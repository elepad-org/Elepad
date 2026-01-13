import { useState, useEffect } from "react";
import { View, Platform } from "react-native";
import { BottomNavigation, useTheme } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";
import { useAuth } from "@/hooks/useAuth";

// ~15% opacity for the active tab indicator background using primary color
const activeIndicatorColor = "rgba(91, 80, 122, 0.15)"; // #5b507a with opacity

export default function TabLayout() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const [index, setIndex] = useState(0);
  const { userElepad } = useAuth();

  const isElder = userElepad?.elder === true;

  // Different routes for elder vs non-elder users
  const elderRoutes = [
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
  ];

  const nonElderRoutes = [
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
      title: "Estadísticas",
      focusedIcon: "chart-line",
      unfocusedIcon: "chart-line-variant",
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
  ];

  const [routes, setRoutes] = useState(elderRoutes);

  // Escuchar cambios en el parámetro 'tab' para cambiar de tab programáticamente
  useEffect(() => {
    if (params.tab) {
      const tabIndex = routes.findIndex((route) => route.key === params.tab);
      if (tabIndex !== -1) {
        setIndex(tabIndex);
      }
    }
  }, [params.tab]);

  // Update routes when user elder status changes
  useEffect(() => {
    if (isElder) {
      setRoutes(elderRoutes);
    } else {
      setRoutes(nonElderRoutes);
    }
  }, [isElder]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    recuerdos: RecuerdosScreen,
    configuracion: ConfiguracionScreen,
  });

  const renderTabBar = (props: any) => (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
          ios: {
            shadowColor: "#18020c",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
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
        {...props}
        safeAreaInsets={{ bottom: 0 }}
        style={{
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 72,
          justifyContent: "center",
        }}
        activeColor={COLORS.primary}
        inactiveColor={COLORS.textLight}
        activeIndicatorStyle={{
          backgroundColor: activeIndicatorColor,
          borderRadius: 12,
        }}
        theme={theme}
        labelMaxFontSizeMultiplier={1.2}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={{ display: "none" }}
        sceneAnimationEnabled={true}
        sceneAnimationType="shifting"
      />
      {renderTabBar({
        navigationState: { index, routes },
        onTabPress: ({ route }: { route: any }) => {
          const newIndex = routes.findIndex((r) => r.key === route.key);
          setIndex(newIndex);
        },
        getLabelText: ({ route }: { route: any }) => route.title,
      })}
    </View>
  );
}
