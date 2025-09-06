import { Tabs } from "expo-router";
import { Icon } from "react-native-paper";
import { COLORS } from "../../styles/base";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ef4444", // Rojo para texto activo
        tabBarInactiveTintColor: "#6b7280", // Gris para texto inactivo
        tabBarStyle: {
          backgroundColor: "#ffffff", // Fondo blanco de la barra
          borderTopColor: "#ef4444", // Borde superior rojo
          borderTopWidth: 2, // Grosor del borde
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
              color={COLORS.primary}
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
              color={COLORS.primary}
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
              color={COLORS.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: "Configuración",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "cog" : "cog-outline"}
              color={COLORS.primary}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
