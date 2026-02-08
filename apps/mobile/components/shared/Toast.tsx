import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from "react-native";
import { Text, Icon } from "react-native-paper";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, FONT } from "@/styles/base";

export type ToastType = "success" | "error" | "info" | "warning" | "streak";

interface ToastProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  withNavbar?: boolean;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: "check-circle",
  error: "alert-circle",
  info: "information",
  warning: "alert",
  streak: "fire", // Fire icon for streak
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: "#9AD6AA", // Soft Pastel Green (Matches Home)
  error: "#FF9999", // Soft Pastel Red (Matches Home)
  info: "#8CC0FF", // Soft Pastel Blue (Matches Home)
  warning: "#FFE082", // Soft Pastel Yellow (Matches Home)
  streak: "#FFD700", // Gold for streak
};

// Confetti colors
const CONFETTI_COLORS_PALETTE = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
];

const Toast = ({
  visible,
  title,
  message,
  type = "info",
  onDismiss,
  duration = 3000,
  action,
  withNavbar,
}: ToastProps) => {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);

  // Confetti Animations
  const confettiAnims = useRef(
    Array.from({ length: 15 }).map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;

  // Get screen dimensions
  const { width: screenWidth } = Dimensions.get("window");

  // Determine if we should account for navbar height
  // If withNavbar is manually passed, use it.
  // Otherwise, auto-detect if we are inside a (tabs) route.
  const effectiveWithNavbar =
    withNavbar !== undefined
      ? withNavbar
      : (segments as string[]).includes("(tabs)");

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Trigger Confetti if type is streak
      if (type === "streak") {
        confettiAnims.forEach((anim) => {
          // Reset: Spawn randomly across the width, and slightly above top
          const startX = (Math.random() - 0.5) * 300; // Wide spread
          const startY = -50 - Math.random() * 50; // Above container

          anim.x.setValue(startX);
          anim.y.setValue(startY);
          anim.opacity.setValue(1);
          anim.rotate.setValue(0);

          const randomDuration = 2000 + Math.random() * 1000;
          const randomRotation = Math.random() * 720 - 360;

          Animated.parallel([
            Animated.timing(anim.y, {
              toValue: 100, // Fall down past the bottom of toast height
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: startX + (Math.random() - 0.5) * 50, // Slight drift
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: randomRotation,
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: randomDuration * 0.8,
              delay: randomDuration * 0.2,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }

      if (duration > 0) {
        const timer = setTimeout(() => {
          hide();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  };

  // Rainbow Animation for Streak Border
  const rainbowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && type === "streak") {
      Animated.loop(
        Animated.timing(rainbowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false, // Color interpolation doesn't support native driver
        }),
      ).start();
    } else {
      rainbowAnim.setValue(0);
    }
  }, [visible, type]);

  const rainbowColor = rainbowAnim.interpolate({
    inputRange: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
    outputRange: [
      "#FFD700", // Gold
      "#FF6B6B", // Red-ish
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#FFA07A", // Orange
      "#98D8C8", // Green-ish
      "#FFD700", // Back to Gold
    ],
  });

  if (!visible && !isVisible) return null;

  // Calculate dynamic bottom position based on navbar presence and safe area
  // Use precise dimensions from BottomTabBar to ensure it sits right on top
  const TAB_BAR_HEIGHT = 72;
  const TAB_BAR_BOTTOM_MARGIN = Platform.OS === "android" ? 14 : 0;

  // Use tighter spacing when navbar is present
  const spacing = effectiveWithNavbar ? 10 : 24;
  const navbarBlockHeight = effectiveWithNavbar
    ? TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN
    : 0;

  const bottomPosition = insets.bottom + spacing + navbarBlockHeight;

  // Calculate responsive width and horizontal margins
  // For smaller screens (< 360px), use more width
  // For medium screens (360-600px), use 90%
  // For larger screens, cap at maxWidth
  const horizontalMargin = screenWidth < 360 ? 12 : 20;
  const calculatedWidth = screenWidth - horizontalMargin * 2;
  const maxWidth = 420;
  const toastWidth = Math.min(calculatedWidth, maxWidth);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          opacity,
          transform: [{ scale }],
          width: toastWidth,
          left: (screenWidth - toastWidth) / 2, // Center horizontally
        },
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Confetti container inside toast for clipped effect */}
        {type === "streak" &&
          confettiAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                bottom: "50%",
                left: "50%",
                width: 8,
                height: 8,
                backgroundColor:
                  CONFETTI_COLORS_PALETTE[
                    index % CONFETTI_COLORS_PALETTE.length
                  ],
                borderRadius: 4,
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
                opacity: anim.opacity,
                zIndex: -1, // Behind the toast content
              }}
            />
          ))}

        <Animated.View
          style={[
            styles.accentBorder,
            {
              backgroundColor:
                type === "streak" ? rainbowColor : TOAST_COLORS[type],
            },
          ]}
        />
        {type !== "streak" && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${TOAST_COLORS[type]}15` },
            ]}
          >
            <Icon
              source={TOAST_ICONS[type]}
              size={24}
              color={TOAST_COLORS[type]}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          {title && (
            <Text
              style={[styles.title, { color: TOAST_COLORS[type] }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {action ? (
          <TouchableOpacity
            onPress={action.onPress}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: TOAST_COLORS[type] }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={hide} style={styles.closeButton}>
            <Icon source="close" size={20} color={COLORS.textPlaceholder} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Context Logic
interface ShowToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  withNavbar?: boolean;
}

interface ToastContextType {
  showToast: (options: ShowToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastConfig, setToastConfig] = useState<
    ToastProps & { visible: boolean }
  >({
    visible: false,
    message: "",
    onDismiss: () => {},
    // withNavbar left undefined to allow auto-detection in component
  });

  const hideToast = useCallback(() => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback(
    ({
      title,
      message,
      type = "info",
      duration = 3000,
      action,
      withNavbar,
    }: ShowToastOptions) => {
      setToastConfig({
        visible: true,
        title,
        message,
        type,
        duration,
        action,
        onDismiss: hideToast,
        withNavbar,
      });
    },
    [hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast {...toastConfig} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
    // Width and left are now set dynamically in the component
    // Add shadow properties to the animated container
    ...SHADOWS.medium,
    borderRadius: 16,
    backgroundColor: COLORS.white, // Ensure shadow has a body to cast from
    // Ensure we don't clip overflow here so shadow is visible
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 60,
    padding: 12,
    // Internal clipping for the accent border
    borderRadius: 16,
    overflow: "hidden",
    // border moved here
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  accentBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 4,
  },
  actionText: {
    fontFamily: FONT.bold,
    fontSize: 13,
  },
});
