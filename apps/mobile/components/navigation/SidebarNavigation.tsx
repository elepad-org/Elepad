import { useState, useEffect } from "react";
import { View, Platform, Animated, Pressable } from "react-native";
import { Icon, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

// ~15% opacity for the active tab indicator background using primary color
const activeIndicatorColor = "rgba(136, 150, 176, 0.15)"; // #8896b0 with opacity

type TabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

interface SidebarNavigationProps {
  routes: TabRoute[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

export default function SidebarNavigation({
  routes,
  activeIndex,
  onIndexChange,
}: SidebarNavigationProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const animatedIndex = useState(() => new Animated.Value(activeIndex))[0];

  const sidebarWidth = isSidebarCollapsed ? 72 : 240;

  // Animate index changes for smooth transitions
  useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: activeIndex,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, animatedIndex]);

  return (
    <View
      style={{
        width: sidebarWidth,
        backgroundColor: COLORS.white,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        paddingTop: 48,
        paddingBottom: 24,
        ...Platform.select({
          ios: {
            shadowColor: "#18020c",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      <View style={{ flex: 1, paddingHorizontal: isSidebarCollapsed ? 8 : 12 }}>
        {routes.map((route: TabRoute, idx: number) => {
          const isFocused = activeIndex === idx;

          const onPress = () => {
            onIndexChange(idx);
          };

          // Interpolate for smooth active indicator animation
          const activeOpacity = animatedIndex.interpolate({
            inputRange: [idx - 1, idx, idx + 1],
            outputRange: [0, 1, 0],
            extrapolate: "clamp",
          });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: isSidebarCollapsed ? 12 : 16,
                marginVertical: 4,
                borderRadius: 12,
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                overflow: "hidden",
              }}
            >
              {/* Animated background indicator */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: activeIndicatorColor,
                  borderRadius: 12,
                  opacity: activeOpacity,
                }}
              />

              {/* Icons Container with animation */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Inactive Icon - Fades Out */}
                <Animated.View
                  style={{
                    position: "absolute",
                    opacity: activeOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  }}
                >
                  <Icon
                    source={route.unfocusedIcon}
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </Animated.View>

                {/* Active Icon - Fades In */}
                <Animated.View
                  style={{
                    position: "absolute",
                    opacity: activeOpacity,
                  }}
                >
                  <Icon
                    source={route.focusedIcon}
                    size={24}
                    color={COLORS.primary}
                  />
                </Animated.View>
              </View>

              {!isSidebarCollapsed && (
                <Animated.View style={{ marginLeft: 16 }}>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: isFocused ? COLORS.primary : COLORS.textSecondary,
                      fontWeight: isFocused ? "600" : "400",
                    }}
                  >
                    {route.title}
                  </Text>
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Toggle button at the bottom */}
      <View
        style={{
          paddingHorizontal: isSidebarCollapsed ? 8 : 12,
          paddingTop: 12,
        }}
      >
        <Pressable
          onPress={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: isSidebarCollapsed ? 12 : 16,
            marginVertical: 4,
            borderRadius: 12,
            backgroundColor: "transparent",
            justifyContent: isSidebarCollapsed ? "center" : "flex-start",
          }}
        >
          <Icon
            source={isSidebarCollapsed ? "chevron-right" : "chevron-left"}
            size={24}
            color={COLORS.textSecondary}
          />
          {!isSidebarCollapsed && (
            <Text
              variant="bodyMedium"
              style={{
                marginLeft: 16,
                color: COLORS.textSecondary,
                fontWeight: "400",
              }}
            >
              Ocultar
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function useSidebarWidth(isCollapsed: boolean): number {
  return isCollapsed ? 72 : 240;
}
