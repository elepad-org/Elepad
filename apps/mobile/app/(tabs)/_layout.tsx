import { useState, useEffect, useMemo } from "react";
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

import { LoadingUser } from "@/components/shared";

import { TabProvider, useTabContext } from "@/context/TabContext";

// Inner component to consume context and handle tabs
function TabsContent() {
  const layout = useWindowDimensions();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const { userElepad, userElepadLoading } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { setActiveTab } = useTabContext();

  const isElder = userElepad?.elder === true;
  const isLargeScreen = layout.width >= 1024;

  const routes = useMemo(() =>
    isElder ? elderRoutes : nonElderRoutes
    , [isElder]);

  // Handle internal index change with logging and context update
  const handleIndexChange = (newIndex: number) => {
    const routeKey = routes[newIndex].key;
    console.log(`📱 Tab changed to: ${routeKey} (Index: ${newIndex})`);
    setActiveTab(routeKey);
    setIndex(newIndex);
  };

  // Escuchar cambios en el parámetro 'tab' para cambiar de tab programáticamente
  useEffect(() => {
    if (params.tab) {
      const tabIndex = routes.findIndex((route) => route.key === params.tab);
      if (tabIndex !== -1) {
        handleIndexChange(tabIndex);
      }
      // Limpiar el parámetro después de cambiar el tab
      setTimeout(() => {
        router.setParams({ tab: undefined });
      }, 100);
    }
  }, [params.tab, routes]);

  const renderScene = useMemo(() => SceneMap({
    home: HomeScreen,
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    recuerdos: RecuerdosScreen,
    configuracion: ConfiguracionScreen,
  }), []);

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
    if (isLargeScreen) return null;
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
      {userElepadLoading || !userElepad ? (
        <LoadingUser />
      ) : (
        <>
          {isLargeScreen && (
            <SidebarNavigation
              routes={routes}
              activeIndex={index}
              onIndexChange={handleIndexChange}
            />
          )}

          <View style={{ flex: 1 }}>
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={handleIndexChange}
              initialLayout={{ width: layout.width }}
              renderTabBar={renderTabBar}
              tabBarPosition="bottom"
              swipeEnabled={!isLargeScreen}
              animationEnabled={true}
              lazy={true}
              lazyPreloadDistance={1}
            />
          </View>
        </>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabProvider>
      <TabsContent />
    </TabProvider>
  );
}
