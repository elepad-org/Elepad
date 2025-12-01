import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT, SHADOWS } from "@/styles/base";

interface CustomHeaderProps {
  /** Title to display in the header */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Whether to show the back button (default: true) */
  showBackButton?: boolean;
  /** Custom back action handler */
  onBackPress?: () => void;
  /** Right action button icon */
  rightIcon?: string;
  /** Right action button handler */
  onRightPress?: () => void;
  /** Whether the header has a transparent background */
  transparent?: boolean;
  /** Whether to use large title style (Apple-style) */
  largeTitle?: boolean;
}

/**
 * CustomHeader - Apple-style unified header component
 *
 * Features:
 * - Clean, minimalist design
 * - Centered title with proper hierarchy
 * - Standardized back button with chevron
 * - Optional right action button
 * - Proper safe area handling
 * - Subtle shadow for depth
 */
export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightIcon,
  onRightPress,
  transparent = false,
  largeTitle = false,
}) => {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        !transparent && styles.containerBackground,
      ]}
    >
      <View style={styles.content}>
        {/* Left side - Back button */}
        <View style={styles.sideContainer}>
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBack}
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
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, largeTitle && styles.largeTitle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side - Optional action */}
        <View style={styles.sideContainer}>
          {rightIcon && onRightPress && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.rightButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <IconButton
                icon={rightIcon}
                size={24}
                iconColor={COLORS.primary}
                style={styles.iconButton}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  containerBackground: {
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    ...Platform.select({
      ios: {
        ...SHADOWS.light,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 4,
  },
  sideContainer: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    // Apple HIG: Navigation bar title is 17pt with semibold weight
    fontSize: 17,
    fontFamily: FONT.semiBold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  largeTitle: {
    // Apple HIG: Large title is 34pt but we use 22pt for mobile optimization
    fontSize: 22,
    fontFamily: FONT.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  rightButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    margin: 0,
  },
});

export default CustomHeader;
