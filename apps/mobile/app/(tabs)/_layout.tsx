import { useState, useEffect } from "react";
import { View, Platform, useWindowDimensions } from "react-native";
import { BottomNavigation, useTheme, Icon } from "react-native-paper";
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
  const theme = useTheme();
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

  const renderTabBar = (props: {
    navigationState: { index: number; routes: TabRoute[] };
  }) => (
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
        navigationState={props.navigationState}
        safeAreaInsets={{ bottom: 0 }}
        onTabPress={({ route }: { route: TabRoute }) => {
          const index = routes.findIndex((r) => r.key === route.key);
          setIndex(index);
        }}
        renderIcon={({
          route,
          focused,
          color,
        }: {
          route: TabRoute;
          focused: boolean;
          color: string;
        }) => (
          <Icon
            source={focused ? route.focusedIcon : route.unfocusedIcon}
            size={24}
            color={color}
          />
        )}
        getLabelText={({ route }: { route: TabRoute }) => route.title}
        style={{
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 72,
        }}
        activeColor={COLORS.primary}
        inactiveColor={COLORS.textLight}
        activeIndicatorStyle={{
          backgroundColor: activeIndicatorColor,
          borderRadius: 12,
        }}
        theme={theme}
        labelMaxFontSizeMultiplier={1.2}
        shifting={false}
      />
    </View>
  );

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
