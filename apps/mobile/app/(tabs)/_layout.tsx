import { useState, useEffect } from "react";
import {
  View,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable,
} from "react-native";
import { Icon, Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { TabView, SceneMap } from "react-native-tab-view";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";
import { useAuth } from "@/hooks/useAuth";

// ~15% opacity for the active tab indicator background using primary color
const activeIndicatorColor = "rgba(91, 80, 122, 0.15)"; // #5b507a with opacity

type TabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export default function TabLayout() {
  const layout = useWindowDimensions();
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

  const renderScene = SceneMap({
    home: HomeScreen,
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    recuerdos: RecuerdosScreen,
    configuracion: ConfiguracionScreen,
  });

  const renderTabBar = (props: any) => {
    const { navigationState, position } = props;

    return (
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
          height: 72,
        }}
      >
        <View style={{ flexDirection: "row", flex: 1 }}>
          {navigationState.routes.map((route: TabRoute, index: number) => {
            const isFocused = navigationState.index === index;

            const onPress = () => {
              props.jumpTo(route.key);
            };

            const inputRange = navigationState.routes.map(
              (_: any, i: number) => i
            );

            // Scale interpolation: 0 -> 1 -> 0
            const activeOpacity = position.interpolate({
              inputRange,
              outputRange: inputRange.map((i: number) => (i === index ? 1 : 0)),
            });

            const activeScale = position.interpolate({
              inputRange,
              outputRange: inputRange.map((i: number) => (i === index ? 1 : 0)),
              extrapolate: "clamp",
            });

            // Specific interpolation for local scale behavior (shrink/grow) per tab center
            // We use the simpler [i-1, i, i+1] logic for per-item animation usually, but
            // the full map above works correctly for the "whole array" input range too.

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  {/* Animated Indicator */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: 64, // Approximate pill width
                      height: 32,
                      top: -4, // Adjust to center behind icon. Icon is ~24. Pill 32.
                      backgroundColor: activeIndicatorColor,
                      borderRadius: 16,
                      opacity: activeOpacity,
                      transform: [{ scale: activeScale }],
                    }}
                  />

                  <Icon
                    source={isFocused ? route.focusedIcon : route.unfocusedIcon}
                    size={24}
                    color={isFocused ? COLORS.primary : COLORS.textLight}
                  />
                </View>

                <Text
                  variant="labelSmall"
                  style={{
                    marginTop: 4,
                    color: isFocused ? COLORS.primary : COLORS.textLight,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {route.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        tabBarPosition="bottom"
        swipeEnabled={true}
        animationEnabled={true}
        lazy={true}
        lazyPreloadDistance={1}
      />
    </View>
  );
}
