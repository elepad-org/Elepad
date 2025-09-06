import React from "react";
import { StatusBar, ScrollView, Image, View } from "react-native";
import { ActivityIndicator, Text, Avatar, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import elepadMantenimiento from "../../assets/images/elepad_mantenimiento.png";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function HomeScreen() {
  const { userElepad, loading } = useAuth();

  if (loading) {
    return (
      <View style={baseStyles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Text style={baseStyles.developmentText}>
        Esta sección está en desarrollo. ¡Pronto habrá juegos disponibles!
      </Text>
    </SafeAreaView>
  );
}
