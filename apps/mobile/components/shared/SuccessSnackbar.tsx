import React from "react";
import { Snackbar } from "react-native-paper";
import { Text, Platform } from "react-native";

interface SuccessSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  duration?: number;
}

/**
 * Snackbar compartido con estilos consistentes para toda la app
 * - Border radius: 20px
 * - Color: Verde éxito (#4CAF50)
 * - Posición: Siempre sobre la barra de navegación
 */
export default function SuccessSnackbar({
  visible,
  onDismiss,
  message,
  duration = 2200,
}: SuccessSnackbarProps) {
  // Margen estandarizado para todas las plataformas
  const bottomMargin = Platform.OS === "web" ? 100 : 85;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: "#4CAF50",
        borderRadius: 20,
        marginBottom: bottomMargin,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
