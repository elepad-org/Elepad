import React from "react";
import { Snackbar } from "react-native-paper";
import { Text, Platform } from "react-native";
import { COLORS } from "@/styles/base";

interface SuccessSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  message: string;
  duration?: number;
}

/**
 * Snackbar for success messages with Apple-style design
 * - Border radius: 16px
 * - Color: iOS System Green
 * - Position: Always above navigation bar
 */
export default function SuccessSnackbar({
  visible,
  onDismiss,
  message,
  duration = 2200,
}: SuccessSnackbarProps) {
  const bottomMargin = Platform.OS === "web" ? 100 : 85;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: COLORS.success,
        borderRadius: 16,
        marginBottom: bottomMargin,
      }}
    >
      <Text style={{ color: COLORS.white, fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
