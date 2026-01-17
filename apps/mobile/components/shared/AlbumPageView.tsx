import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, SHADOWS } from "@/styles/base";
import { AlbumPage } from "@elepad/api-client";

interface AlbumPageViewProps {
  page: AlbumPage;
  pageNumber: number;
  totalPages: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AlbumPageView({
  page,
  pageNumber,
  totalPages,
}: AlbumPageViewProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <View style={styles.container}>
      {/* Left Side - Photo */}
      <View style={styles.leftSide}>
        <View style={styles.polaroidContainer}>
          <View style={styles.polaroid}>
            {page.imageUrl && !imageError ? (
              <Image
                source={{ uri: page.imageUrl }}
                style={styles.photo}
                resizeMode="cover"
                onError={() => setImageError(true)}
                accessibilityLabel={page.title || "Memoria"}
              />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.placeholderText}>{page.title || "Memoria"}</Text>
              </View>
            )}
            {/* Polaroid bottom space */}
            <View style={styles.polaroidBottom}>
              {page.title && (
                <Text style={styles.captionText} numberOfLines={2}>
                  {page.title}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Right Side - Narrative */}
      <View style={styles.rightSide}>
        <View style={styles.narrativeContainer}>
          <Text style={styles.narrativeText}>
            {page.description || "Generando narrativa..."}
          </Text>
        </View>

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            Página {pageNumber} de {totalPages}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F5E6D3",
    paddingHorizontal: 70, // Espacio para los botones laterales
    paddingVertical: 60, // Espacio para botones superior e inferior
  },
  leftSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rightSide: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    position: "relative",
  },
  polaroidContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  polaroid: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 4,
    ...SHADOWS.medium,
    // Slight rotation for realistic effect
    transform: [{ rotate: "-2deg" }],
    maxWidth: SCREEN_HEIGHT * 0.55, // In landscape, height is smaller dimension
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  photo: {
    width: SCREEN_HEIGHT * 0.4,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  placeholderPhoto: {
    width: SCREEN_HEIGHT * 0.4,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 2,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  polaroidBottom: {
    marginTop: 12,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  captionText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: "italic",
    textAlign: "center",
    fontFamily: "Georgia", // Handwritten-like serif font
  },
  narrativeContainer: {
    flex: 1,
    justifyContent: "center",
  },
  narrativeText: {
    fontSize: 20,
    lineHeight: 32,
    color: "#2C2416", // Dark brown for good contrast
    fontFamily: "Georgia", // Serif font for nostalgic feel
    textAlign: "left",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 20,
    right: 30,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
});
