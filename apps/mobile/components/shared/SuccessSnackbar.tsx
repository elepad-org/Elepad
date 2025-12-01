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
 * Snackbar for success messages with consistent design
 * - Border radius: 16px
 * - Color: Success green
 * - Position: Always above navigation bar (120px margin)
 */
export default function SuccessSnackbar({
  visible,
  onDismiss,
  message,
  duration = 2200,
}: SuccessSnackbarProps) {
  const bottomMargin = Platform.OS === "web" ? 120 : 120;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: COLORS.success,
        borderRadius: 16,
        marginBottom: bottomMargin,
        marginHorizontal: 20,
      }}
    >
      <Text style={{ color: COLORS.white, fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
