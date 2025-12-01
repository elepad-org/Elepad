import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton, Icon } from "react-native-paper";
import { router } from "expo-router";
import { COLORS, FONT } from "@/styles/base";

interface GameHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  onHelpPress?: () => void;
  iconColor?: string;
  useIconComponent?: boolean;
}

/**
 * GameHeader - Apple-style header for game screens
 *
 * Features:
 * - Clean, minimalist design with iOS System Blue accent
 * - Centered title with game icon
 * - Standardized back button with chevron
 * - Optional help button
 * - Proper touch areas with hitSlop
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  icon,
  title,
  subtitle,
  onHelpPress,
  iconColor,
  useIconComponent = false,
}) => {
  return (
    <View style={styles.header}>
      {/* Back button - Left aligned */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <IconButton
          icon="chevron-left"
          size={28}
          iconColor={COLORS.primary}
          style={styles.iconButton}
        />
      </TouchableOpacity>

      {/* Title container - Centered */}
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          {useIconComponent ? (
            <Icon source={icon} size={28} color={iconColor || COLORS.primary} />
          ) : (
            <Text style={styles.iconText}>{icon}</Text>
          )}
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Help button - Right aligned */}
      <View style={styles.helpContainer}>
        {onHelpPress && (
          <TouchableOpacity
            onPress={onHelpPress}
            style={styles.helpButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <IconButton
              icon="help-circle-outline"
              size={24}
              iconColor={COLORS.textLight}
              style={styles.iconButton}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
    minHeight: 56,
  },
  backButton: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  helpContainer: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  helpButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    margin: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconText: {
    fontSize: 26,
  },
  // Additional styling for headlineSmall variant to match Apple HIG
  title: {
    fontFamily: FONT.semiBold,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: "center",
  },
});
