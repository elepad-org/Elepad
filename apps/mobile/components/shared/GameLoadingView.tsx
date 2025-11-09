import React from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface GameLoadingViewProps {
  message?: string;
  color?: string;
  size?: "small" | "large";
}

/**
 * Componente de loading reutilizable para todos los juegos
 * Muestra un spinner con un mensaje personalizable
 */
export const GameLoadingView: React.FC<GameLoadingViewProps> = ({
  message = "Preparando el juego...",
  color = COLORS.primary,
  size = "large",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text variant="bodyLarge" style={styles.text}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
});
