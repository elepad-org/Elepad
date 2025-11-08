import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { COLORS } from "@/styles/base";

interface GameHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  onHelpPress?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  icon,
  title,
  subtitle,
  onHelpPress,
}) => {
  return (
    <View style={styles.header}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => router.back()}
        style={styles.backButton}
        iconColor={COLORS.primary}
      />
      <Text variant="headlineMedium" style={styles.title}>
        {icon} {title}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {subtitle}
      </Text>
      {onHelpPress && (
        <IconButton
          icon="help-circle-outline"
          size={24}
          onPress={onHelpPress}
          style={styles.helpButton}
          iconColor={COLORS.textSecondary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
    paddingHorizontal: 16,
  },
  backButton: {
    position: "absolute",
    left: -8,
    top: 0,
    zIndex: 1,
  },
  helpButton: {
    position: "absolute",
    right: -8,
    top: 0,
    zIndex: 1,
  },
  title: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
