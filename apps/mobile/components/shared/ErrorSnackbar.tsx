import React from "react";
import { Snackbar } from "react-native-paper";
import { Text, Platform } from "react-native";

interface ErrorSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  duration?: number;
}

/**
 * Snackbar de error con estilos consistentes para toda la app
 * - Border radius: 20px
 * - Color: Rojo error (#dc3545)
 * - Posición: Siempre sobre la barra de navegación
 */
export default function ErrorSnackbar({
  visible,
  onDismiss,
  message,
  duration = 4000,
}: ErrorSnackbarProps) {
  // Margen estandarizado para todas las plataformas
  const bottomMargin = Platform.OS === "web" ? 100 : 85;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: "#dc3545",
        borderRadius: 20,
        marginBottom: bottomMargin,
      }}
      action={{
        label: "OK",
        onPress: onDismiss,
        textColor: "#fff",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
