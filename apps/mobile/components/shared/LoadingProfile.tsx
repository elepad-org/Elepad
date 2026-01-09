import React from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface LoadingProfileProps {
  message?: string;
  color?: string;
  size?: "small" | "large";
}

/**
 * Componente de loading para el perfil del usuario
 * Muestra un spinner con un mensaje personalizable mientras se cargan los datos del usuario
 */
export const LoadingProfile: React.FC<LoadingProfileProps> = ({
  message = "Cargando perfil...",
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
    minHeight: 200, // Altura mínima para evitar saltos abruptos
  },
  text: {
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
});