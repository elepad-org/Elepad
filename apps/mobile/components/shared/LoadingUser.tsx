import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text } from "react-native-paper";
import eleIdea from "@/assets/images/ele-idea.png";
import { COLORS, FONT } from "@/styles/base";

/**
 * Componente de loading fullscreen para cargar datos del usuario
 * Se muestra después del login mientras se obtienen los datos del usuario
 */
export const LoadingUser: React.FC = () => {
  console.log('🔄 LoadingUser: Renderizando pantalla de carga');

  return (
    <View style={styles.container}>
      <Image source={eleIdea} style={styles.image} resizeMode="contain" />
      <Text style={styles.text}>Cargando...</Text>
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
    fontSize: 16,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
  },
});
