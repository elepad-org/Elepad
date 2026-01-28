import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text } from "react-native-paper";
import eleIdea from "@/assets/images/ele-idea.png";
import { COLORS, FONT } from "@/styles/base";

/**
 * Componente de loading fullscreen para cargar datos del usuario
 * Se muestra después del login mientras se obtienen los datos del usuario
 */
export const LoadingUser: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Animación de pulso para la imagen
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Animación de puntitos para el texto
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      pulse.stop();
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={eleIdea}
        style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
      <Text style={styles.text}>Cargando{dots}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  image: {
    width: 200,
    height: 200,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    minWidth: 100, // Para evitar saltos por el cambio de ancho del texto
    textAlign: "center",
  },
});
