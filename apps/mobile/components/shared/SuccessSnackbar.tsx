import React from "react";
import { Snackbar } from "react-native-paper";
import { Text } from "react-native";
import { COLORS, LAYOUT } from "@/styles/base";

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
 * - Position: Always above navigation bar
 */
export default function SuccessSnackbar({
  visible,
  onDismiss,
  message,
  duration = 2200,
}: SuccessSnackbarProps) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: COLORS.success,
        borderRadius: 16,
        marginBottom: LAYOUT.bottomNavHeight + 10,
        marginHorizontal: 20,
      }}
    >
      <Text style={{ color: COLORS.white, fontSize: 15 }}>{message}</Text>
    </Snackbar>
  );
}
