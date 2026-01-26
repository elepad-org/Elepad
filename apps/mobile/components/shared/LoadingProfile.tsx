import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import LottieView from "lottie-react-native";
import loadingAnimation from "@/assets/animations/ele.json";
import { COLORS } from "@/styles/base";

interface LoadingProfileProps {
  message?: string;
}

/**
 * Componente de loading para el perfil del usuario
 * Muestra una animación Lottie con un mensaje personalizable mientras se cargan los datos del usuario
 */
export const LoadingProfile: React.FC<LoadingProfileProps> = ({
  message = "Cargando perfil...",
}) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={loadingAnimation}
        autoPlay
        loop
        style={styles.animation}
      />
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
  animation: {
    width: 120,
    height: 120,
  },
  text: {
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
});