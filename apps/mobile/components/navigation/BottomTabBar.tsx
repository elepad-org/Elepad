import { View, Platform, Animated, Pressable } from "react-native";
import { Icon, Text } from "react-native-paper";
import { NavigationState } from "react-native-tab-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/styles/base";

// ~15% opacity for the active tab indicator background using primary color
const activeIndicatorColor = "rgba(136, 150, 176, 0.15)"; // #8896b0 with opacity

type TabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

interface BottomTabBarProps {
  navigationState: NavigationState<TabRoute>;
  position: Animated.AnimatedInterpolation<number>;
  jumpTo: (key: string) => void;
}

export default function BottomTabBar({
  navigationState,
  position,
  jumpTo,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom position: base padding + safe area inset for navigation buttons
  const bottomPosition = Platform.select({
    ios: insets.bottom,
    android: 14 + insets.bottom,
    default: 14 + insets.bottom,
  });
  
  return (
    <View
      style={{
        position: "absolute",
        bottom: bottomPosition,
        left: 20,
        right: 20,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
          ios: {
            shadowColor: "#18020c",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          },
          android: {
            elevation: 8,
          },
        }),
        zIndex: 1, // Lower zIndex so it stays behind modals (which usually use Portals)
        height: 72,
      }}
    >
      <View style={{ flexDirection: "row", flex: 1 }}>
        {navigationState.routes.map((route: TabRoute, index: number) => {
          const isFocused = navigationState.index === index;

          const onPress = () => {
            jumpTo(route.key);
          };

          // Smooth transition over full swipe distance to clearly show shrink/grow effect
          const activeOpacity = position.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0, 1, 0],
            extrapolate: "clamp",
          });

          const activeScale = activeOpacity;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                {/* Animated Indicator */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 64, // Approximate pill width
                    height: 32,
                    top: -4, // Adjust to center behind icon. Icon is ~24. Pill 32.
                    backgroundColor: activeIndicatorColor,
                    borderRadius: 16,
                    opacity: activeOpacity,
                    transform: [{ scale: activeScale }],
                  }}
                />

                {/* Icons Container */}
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
              </View>

              <Text
                variant="labelSmall"
                style={{
                  marginTop: 4,
                  color: isFocused ? COLORS.primary : COLORS.textSecondary,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {route.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
