import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { View, useWindowDimensions, Keyboard, Animated, InteractionManager, BackHandler, Platform } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { TabView, SceneMap } from "react-native-tab-view";
import HomeScreen from "./home";
import JuegosScreen from "./juegos";
import RecuerdosScreen from "./recuerdos";
import CalendarScreen from "./calendar";
import { COLORS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import SidebarNavigation from "@/components/navigation/SidebarNavigation";
import BottomTabBar from "@/components/navigation/BottomTabBar";
import { elderRoutes, nonElderRoutes, TabRoute } from "@/components/navigation/navigationConfig";

import { LoadingUser } from "@/components/shared";
import { TabProvider, useTabContext } from "@/context/TabContext";
import { useTourContext } from "@/components/tour/TourProvider";

// Component strictly for syncing state to context to avoid re-rendering the layout
const TabStateSyncer = memo(function TabStateSyncer({ index, routes }: { index: number; routes: TabRoute[] }) {
  const { setActiveTab } = useTabContext();

  useEffect(() => {
    if (routes[index]) {
      const routeKey = routes[index].key;
      // Use InteractionManager to ensure the update happens after animations complete
      const task = InteractionManager.runAfterInteractions(() => {
        setActiveTab(routeKey);
      });

      return () => task.cancel();
    }
  }, [index, routes, setActiveTab]);

  return null;
});

function TabLayoutContent() {
  const layout = useWindowDimensions();
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { userElepad, userElepadLoading } = useAuth();
  const isElder = userElepad?.elder === true;

  const routes = useMemo(() =>
    isElder ? elderRoutes : nonElderRoutes
    , [isElder]);

  const [index, setIndex] = useState(() => {
    // Inicializar el tab correcto basándose en los parámetros de ruta para evitar un "flash" del tab 0 (Home)
    if (params.tab) {
      const tabIndex = routes.findIndex((route) => route.key === params.tab);
      return tabIndex !== -1 ? tabIndex : 0;
    }
    return 0;
  });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { state: tourState } = useTourContext();
  // Removed useTabContext from here to prevent re-renders

  // Detectar si es una pantalla muy grande (desktop/web)
  // Usamos 1024px como breakpoint para que tablets usen el tab bar
  // y solo pantallas de PC/desktop muestren el sidebar
  const isLargeScreen = layout.width >= 1024;

  // Escuchar cambios subsecuentes en el parámetro 'tab' para cambiar de tab programáticamente
  useEffect(() => {
    if (params.tab) {
      const tabIndex = routes.findIndex((route) => route.key === params.tab);
      if (tabIndex !== -1 && tabIndex !== index) {
        setIndex(tabIndex);
      }
      // Limpiar el parámetro inmediatamente para evitar re-renders lentos en los tabs hijos
      router.setParams({ tab: undefined });
    }
  }, [params.tab, routes, index, router]);



  // En Android, interceptar el botón/gesto atrás para salir de la app
  // en vez de volver al stack anterior (ej: pantalla index/login)
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Solo interceptar si la pantalla de tabs está enfocada (no cuando hay
      // screens apilados encima, como albums o album-viewer)
      if (!navigation.isFocused()) return false;
      BackHandler.exitApp();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const renderScene = useMemo(() => SceneMap({
    home: HomeScreen,
    calendar: CalendarScreen,
    juegos: JuegosScreen,
    recuerdos: RecuerdosScreen,
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

  const navigationState = useMemo(() => ({ index, routes }), [index, routes]);

  const renderTabBar = useCallback((props: {
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
  }, [isLargeScreen, isKeyboardVisible]);

  return (

    <View
      style={{ flex: 1, backgroundColor: COLORS.background, flexDirection: "row" }}
    >
      {userElepadLoading || !userElepad ? (
        // Mostrar loading fullscreen mientras se carga el usuario o si no hay usuario
        <LoadingUser />
      ) : (
        <>
          <TabStateSyncer index={index} routes={routes} />

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
              navigationState={navigationState}
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
        </>
      )}
      {tourState.isPreparing && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 9999,
          }}
          pointerEvents="auto"
        />
      )}
    </View>

  );
}

export default function TabLayout() {
  return (
    <TabProvider>
      <TabLayoutContent />
    </TabProvider>
  );
}
