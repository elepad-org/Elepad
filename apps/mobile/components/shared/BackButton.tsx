import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { router } from "expo-router";
import { COLORS } from "@/styles/base";

interface BackButtonProps {
  /** Custom back action handler */
  onPress?: () => void;
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (default: primary color) */
  color?: string;
}

/**
 * BackButton - Standardized back button component
 *
 * Features:
 * - Consistent styling across the app
 * - Automatic navigation with router.back()
 * - Customizable icon size and color
 * - Proper touch handling
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  size = 24,
  color = COLORS.primary,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 12, bottom: 12, left: 0, right: 12 }}
      activeOpacity={0.7}
    >
      <IconButton
        icon="chevron-left"
        size={size}
        iconColor={color}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: -12,
  },
  icon: {
    margin: 0,
  },
});
