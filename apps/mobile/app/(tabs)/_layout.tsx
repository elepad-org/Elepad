import { useState, useEffect } from "react";
import { View, useWindowDimensions, Keyboard, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TabView, SceneMap } from "react-native-tab-view";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import ConfiguracionScreen from "./configuracion";
import CalendarScreen from "./calendar";
import { COLORS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import SidebarNavigation from "@/components/navigation/SidebarNavigation";
import BottomTabBar from "@/components/navigation/BottomTabBar";
import { elderRoutes, nonElderRoutes, TabRoute } from "@/components/navigation/navigationConfig";

export default function TabLayout() {
  const layout = useWindowDimensions();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { userElepad } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const isElder = userElepad?.elder === true;
  const isLargeScreen = layout.width >= 768;

  const [routes, setRoutes] = useState<TabRoute[]>(
    isElder ? elderRoutes : nonElderRoutes
  );

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
    setRoutes(isElder ? elderRoutes : nonElderRoutes);
  }, [isElder]);

  const renderScene = SceneMap({
    home: HomeScreen,
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    recuerdos: RecuerdosScreen,
    configuracion: ConfiguracionScreen,
  });

  // Detect global keyboard visibility to hide tab bar
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const renderTabBar = (props: {
    navigationState: { index: number; routes: TabRoute[] };
    position: Animated.AnimatedInterpolation<number>;
    jumpTo: (key: string) => void;
  }) => {
    // Don't render tab bar for large screens (sidebar is used instead)
    if (isLargeScreen) return null;

    // If keyboard is open on mobile, do not render the tab bar
    if (isKeyboardVisible) return null;

    return (
      <BottomTabBar
        navigationState={props.navigationState}
        position={props.position}
        jumpTo={props.jumpTo}
      />
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.background, flexDirection: "row" }}
    >
      {/* Sidebar for large screens */}
      {isLargeScreen && (
        <SidebarNavigation
          routes={routes}
          activeIndex={index}
          onIndexChange={setIndex}
        />
      )}

      {/* Content area */}
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          tabBarPosition="bottom"
          swipeEnabled={!isLargeScreen}
          animationEnabled={true}
          lazy={true}
          lazyPreloadDistance={1}
        />
      </View>
    </View>
  );
}
