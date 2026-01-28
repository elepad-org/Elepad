import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import loadingAnimation from "@/assets/animations/ele.json";

/**
 * Componente de loading para el perfil del usuario
 * Muestra una animación Lottie de un elefante girando mientras se cargan los datos del usuario
 */
export const LoadingProfile: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={loadingAnimation}
        autoPlay
        loop
        style={styles.animation}
      />
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
    width: 175,
    height: 175,
  },
});