import { Tabs } from "expo-router";
import { Icon } from "react-native-paper";
import { COLORS } from "../../styles/base";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent, // Color accent para texto activo
        tabBarInactiveTintColor: COLORS.accent, // Color accent para texto inactivo
        tabBarStyle: {
          backgroundColor: COLORS.border,
          borderTopWidth: 0, // Sin borde para que se vea uniforme
          elevation: 0, // Sin sombra en Android
          shadowOpacity: 0, // Sin sombra en iOS
          paddingTop: 8, // Más margen arriba para centrar mejor
          paddingBottom: 8, // Margen abajo para centrar
          height: 88, // Altura más grande para los textos
          justifyContent: "center", // Centrar contenido
          alignItems: "center", // Centrar items
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarShowLabel: true, // Mostrar las etiquetas/palabras
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <Icon
              source={focused ? "home" : "home-outline"}
              color={COLORS.accent}
              size={28}
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
              color={COLORS.accent}
              size={28}
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
              color={COLORS.accent}
              size={28}
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
              color={COLORS.accent}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
