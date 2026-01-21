import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, Icon } from "react-native-paper";
import { useSegments } from "expo-router";
import { COLORS, SHADOWS, FONT, LAYOUT } from "@/styles/base";

export type ToastType = "success" | "error" | "info" | "warning";

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
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: "#9AD6AA", // Soft Pastel Green (Matches Home)
  error: "#FF9999", // Soft Pastel Red (Matches Home)
  info: "#8CC0FF", // Soft Pastel Blue (Matches Home)
  warning: "#FFE082", // Soft Pastel Yellow (Matches Home)
};

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
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);

  // Determine if we should account for navbar height
  // If withNavbar is manually passed, use it.
  // Otherwise, auto-detect if we are inside a (tabs) route.
  const effectiveWithNavbar =
    withNavbar !== undefined ? withNavbar : segments.includes("(tabs)");

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

  if (!visible && !isVisible) return null;

  // Calculate dynamic bottom position based on navbar presence
  const bottomPosition = effectiveWithNavbar ? LAYOUT.bottomNavHeight + 10 : 30;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <View
          style={[styles.accentBorder, { backgroundColor: TOAST_COLORS[type] }]}
        />
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
    left: 20,
    right: 20,
    zIndex: 9999,
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
