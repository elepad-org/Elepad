import { useState, useEffect } from "react";
import {
  View,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable,
  Keyboard,
} from "react-native";
import { Icon, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  TabView,
  SceneMap,
  SceneRendererProps,
  NavigationState,
} from "react-native-tab-view";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import { COLORS } from "@/styles/base";
import CalendarScreen from "./calendar";
import { useAuth } from "@/hooks/useAuth";

// ~15% opacity for the active tab indicator background using primary color
const activeIndicatorColor = "rgba(136, 150, 176, 0.15)"; // #8896b0 with opacity

type TabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export default function TabLayout() {
  const layout = useWindowDimensions();
  const params = useLocalSearchParams();
  const router = useRouter();
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

  const [routes, setRoutes] = useState(isElder ? elderRoutes : nonElderRoutes);

  // Escuchar cambios en el parámetro 'tab' para cambiar de tab programáticamente
  useEffect(() => {
    if (params.tab) {
      const tabIndex = routes.findIndex((route) => route.key === params.tab);
      if (tabIndex !== -1) {
        setIndex(tabIndex);
      }
      // Limpiar el parámetro después de cambiar el tab
      setTimeout(() => {
        router.setParams({ tab: undefined });
      }, 100);
    }
  }, [params.tab, routes]);

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

  // Detect global keyboard visibility to hide tab bar
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Keyboard listeners
    const showListener =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideListener =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = () => setIsKeyboardVisible(true);
    const onHide = () => setIsKeyboardVisible(false);

    const showSubscription = Keyboard.addListener(showListener, onShow);
    const hideSubscription = Keyboard.addListener(hideListener, onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: NavigationState<{
        key: string;
        title: string;
        focusedIcon: string;
        unfocusedIcon: string;
      }>;
    },
  ) => {
    const { navigationState, position } = props;

    // If keyboard is open, do not render the floating tab bar
    if (isKeyboardVisible) return null;

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

            // Smooth transition over full swipe distance to clearly show shrink/grow effect
            const activeOpacity = position.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            });

            const activeScale = activeOpacity;

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

                  {/* Icons Container */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Inactive Icon - Fades Out */}
                    <Animated.View
                      style={{
                        position: "absolute",
                        opacity: activeOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0],
                        }),
                      }}
                    >
                      <Icon
                        source={route.unfocusedIcon}
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </Animated.View>

                    {/* Active Icon - Fades In */}
                    <Animated.View
                      style={{
                        position: "absolute",
                        opacity: activeOpacity,
                      }}
                    >
                      <Icon
                        source={route.focusedIcon}
                        size={24}
                        color={COLORS.primary}
                      />
                    </Animated.View>
                  </View>
                </View>

                <Text
                  variant="labelSmall"
                  style={{
                    marginTop: 4,
                    color: isFocused ? COLORS.primary : COLORS.textSecondary,
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
