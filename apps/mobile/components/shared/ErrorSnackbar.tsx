import React from "react";
import { Snackbar } from "react-native-paper";
import { Text, Platform } from "react-native";
import { COLORS } from "@/styles/base";

interface ErrorSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  duration?: number;
}

/**
 * Snackbar for error messages with Apple-style design
 * - Border radius: 16px
 * - Color: iOS System Red
 * - Position: Always above navigation bar
 */
export default function ErrorSnackbar({
  visible,
  onDismiss,
  message,
  duration = 4000,
}: ErrorSnackbarProps) {
  const bottomMargin = Platform.OS === "web" ? 100 : 85;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: COLORS.error,
        borderRadius: 16,
        marginBottom: bottomMargin,
      }}
      action={{
        label: "OK",
        onPress: onDismiss,
        textColor: COLORS.white,
      }}
    >
      <Text style={{ color: COLORS.white, fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
