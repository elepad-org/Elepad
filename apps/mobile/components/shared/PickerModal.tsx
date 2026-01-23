import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ViewStyle,
} from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Portal, Surface, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface PickerOption {
  id: string;
  label: string;
  avatarUrl?: string | null;
  frameUrl?: string | null;
  icon?: React.ReactNode;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  onSelect: (option: PickerOption) => void;
  onDismiss?: () => void;
  maxHeight?: number;
  anchorPosition?: { top: number; left: number; width: number };
}

export default function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onDismiss,
  maxHeight = 200,
  anchorPosition,
}: PickerModalProps) {
  if (!visible || options.length === 0) return null;

  // Position dropdown below anchor if provided, otherwise center it
  const positionStyle: ViewStyle = anchorPosition
    ? {
        position: "absolute" as const,
        top: anchorPosition.top + 4,
        left: anchorPosition.left,
        width: anchorPosition.width,
        zIndex: 9999,
      }
    : {
        position: "absolute" as const,
        top: "50%",
        left: "10%",
        right: "10%",
        transform: [{ translateY: -100 }],
        zIndex: 9999,
      };

  return (
    <Portal>
      {onDismiss && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
          onPress={onDismiss}
          activeOpacity={1}
        />
      )}
      <View style={positionStyle}>
        <Surface
          style={{
            backgroundColor: COLORS.background,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            maxHeight,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <ScrollView style={{ maxHeight }}>
            <View style={{ padding: 8 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontWeight: "600",
                }}
              >
                {title}
              </Text>
              {options.map((option, index) => (
                <Animated.View
                  entering={FadeInLeft.delay(index * 30).springify()}
                  key={option.id}
                >
                  <TouchableOpacity
                    onPress={() => onSelect(option)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor:
                        index % 2 === 0
                          ? "transparent"
                          : COLORS.backgroundSecondary,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {option.icon ? (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: COLORS.backgroundSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          {option.icon}
                        </View>
                      ) : option.avatarUrl ? (
                        <View style={{ position: "relative", marginRight: 12 }}>
                          <Image
                            source={{ uri: option.avatarUrl }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                            }}
                          />
                          {option.frameUrl && (
                            <Image
                              source={{ uri: option.frameUrl }}
                              style={{
                                position: "absolute",
                                width: 32 * 1.4,
                                height: 32 * 1.4,
                                top: -32 * 0.2,
                                left: -32 * 0.2,
                                zIndex: 10,
                              }}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                      ) : (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: COLORS.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: COLORS.white,
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {option.label.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={{
                          fontSize: 16,
                          color: COLORS.text,
                          fontWeight: "500",
                        }}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </Surface>
      </View>
    </Portal>
  );
}
