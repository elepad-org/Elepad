import { Tabs } from "expo-router";
import { Icon } from "react-native-paper";
import { COLORS } from "../../styles/base";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.textLight, // Rojo para texto activo
        tabBarInactiveTintColor: COLORS.textLight, // Gris para texto inactivo
        tabBarStyle: {
          backgroundColor: COLORS.border,
          borderTopWidth: 0, // Sin borde para que se vea uniforme
          elevation: 0, // Sin sombra en Android
          shadowOpacity: 0, // Sin sombra en iOS
          paddingTop: 4, // Margen arriba para toda la barra
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "home" : "home-outline"}
              color={COLORS.textLight}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "compass" : "compass-outline"}
              color={COLORS.textLight}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="juegos"
        options={{
          title: "Juegos",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "gamepad-variant" : "gamepad-variant-outline"}
              color={COLORS.textLight}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: "Config.",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "cog" : "cog-outline"}
              color={COLORS.textLight}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
