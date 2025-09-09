import { Tabs } from "expo-router";
import { Icon, useTheme } from "react-native-paper";
import { COLORS } from "../../styles/base";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary, // Use theme primary color
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant, // Use theme secondary text
        tabBarStyle: {
          backgroundColor: theme.colors.surface, // Use theme surface color
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline, // Subtle border
          elevation: 8, // Add elevation for depth
          shadowOpacity: 0.1, // Subtle shadow
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          fontFamily: theme.fonts.labelMedium.fontFamily,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <Icon
              source={focused ? "home" : "home-outline"}
              color={COLORS.primary}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          tabBarIcon: ({ focused }) => (
            <Icon
              source={focused ? "compass" : "compass-outline"}
              color={COLORS.primary}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="juegos"
        options={{
          title: "Juegos",
          tabBarIcon: ({ focused }) => (
            <Icon
              source={focused ? "puzzle" : "puzzle-outline"}
              color={COLORS.primary}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: "Config.",
          tabBarIcon: ({ focused }) => (
            <Icon
              source={focused ? "cog" : "cog-outline"}
              color={COLORS.primary}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
