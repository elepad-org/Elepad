import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "@/styles/base";
import { useGetShopInventory } from "@elepad/api-client";
import { useRouter } from "expo-router";

interface StickerReactionPickerProps {
  onReact: (stickerId: string) => void;
  disabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_SIZE = 44;
const STICKER_SIZE = 40;
const EXPANDED_HEIGHT = 56;

export default function StickerReactionPicker({
  onReact,
  disabled = false,
}: StickerReactionPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Normalize data helper
  const normalizeData = (data: unknown): any => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as Record<string, any>).data;
    }
    return data;
  };

  // Get user's sticker inventory
  const inventoryResponse = useGetShopInventory();
  const inventoryData = normalizeData(inventoryResponse.data);
  const isLoading = inventoryResponse.isLoading;

  // Filter only stickers from inventory - using 'type' field from shop_items table
  const stickers = Array.isArray(inventoryData)
    ? inventoryData.filter((item: any) => {
        const itemType = item.item?.type || item.type;
        console.log("Item type:", itemType, "Full item:", item);
        return itemType === "Sticker" || itemType === "sticker";
      })
    : [];

  // Debug logs
  console.log("=== StickerReactionPicker Debug ===");
  console.log("isLoading:", isLoading);
  console.log("inventoryData:", inventoryData);
  console.log("stickers found:", stickers.length);
  if (stickers.length > 0) {
    console.log("First sticker:", stickers[0]);
  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, [isExpanded]);

  const handleToggle = () => {
    if (disabled) return;
    setIsExpanded(!isExpanded);
  };

  const handleStickerPress = (stickerId: string) => {
    onReact(stickerId);
    setIsExpanded(false);
  };

  const handleShopPress = () => {
    setIsExpanded(false);
    router.push("/shop");
  };

  // Calculate width with maximum limit for scrolling
  const MAX_PICKER_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width
  const totalItems = stickers.length + 1; // +1 for shop button
  const calculatedWidth = totalItems * (STICKER_SIZE + 12) + 70;

  const containerWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BUTTON_SIZE, Math.min(MAX_PICKER_WIDTH, calculatedWidth)],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingButton}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pickerContainer,
          {
            width: containerWidth,
          },
        ]}
      >
        {/* Expanded sticker list */}
        {isExpanded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerList}
            style={styles.scrollView}
          >
            {stickers.map((inventoryItem: Record<string, any>) => (
              <Pressable
                key={inventoryItem.id}
                onPress={() => handleStickerPress(inventoryItem.itemId)}
                style={({ pressed }) => [
                  styles.stickerButton,
                  pressed && styles.stickerPressed,
                ]}
              >
                <Animated.View
                  style={{
                    opacity: expandAnim,
                    transform: [
                      {
                        scale: expandAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  }}
                >
                  {inventoryItem.item?.assetUrl ? (
                    <Image
                      source={{ uri: inventoryItem.item.assetUrl }}
                      style={styles.stickerImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.stickerPlaceholder}>🎁</Text>
                  )}
                </Animated.View>
              </Pressable>
            ))}

            {/* Shop button at the end */}
            <Pressable
              onPress={handleShopPress}
              style={({ pressed }) => [
                styles.shopButton,
                pressed && styles.stickerPressed,
              ]}
            >
              <Animated.View
                style={{
                  opacity: expandAnim,
                  transform: [
                    {
                      scale: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.shopButtonInner}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
              </Animated.View>
            </Pressable>
          </ScrollView>
        )}

        {/* Toggle button */}
        <Pressable
          onPress={handleToggle}
          disabled={disabled}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.togglePressed,
            disabled && styles.toggleDisabled,
          ]}
        >
          <Animated.View
            style={{
              transform: [{ rotate }],
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="sticker-circle-outline"
              size={24}
              color={COLORS.white}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 12,
    paddingRight: 16,
    zIndex: 1000,
  },
  pickerContainer: {
    height: EXPANDED_HEIGHT,
    backgroundColor: COLORS.white,
    borderRadius: EXPANDED_HEIGHT / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    ...SHADOWS.medium,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  stickerList: {
    paddingRight: 10,
    alignItems: "center",
    gap: 8,
  },
  stickerButton: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  stickerPressed: {
    transform: [{ scale: 0.85 }],
  },
  stickerImage: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
  },
  stickerPlaceholder: {
    fontSize: 32,
  },
  shopButton: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  shopButtonInner: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    borderRadius: STICKER_SIZE / 2,
    backgroundColor: COLORS.primary + "15",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
    padding: 0,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  togglePressed: {
    transform: [{ scale: 0.95 }],
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  loadingButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.card,
  },
});
