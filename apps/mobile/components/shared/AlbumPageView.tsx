import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Image, ScrollView } from "react-native";
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
        <View style={styles.narrativeWrapper}>
          <ScrollView
            style={styles.narrativeContainer}
            contentContainerStyle={styles.narrativeContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
            overScrollMode="never"
          >
            <Text style={styles.narrativeText}>
              {page.description || "Generando narrativa..."}
            </Text>
          </ScrollView>
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
    paddingHorizontal: 70, // Espacio para los botones laterales
    paddingVertical: 40, // Espacio para botones superior e inferior
  },
  leftSide: {
    flex: 1,
    justifyContent: "center",
    maxWidth: "50%",
    alignItems: "center",
    padding: 20,
  },
  rightSide: {
    flex: 1,
    maxWidth: "50%", // Ensure text container doesn't grow beyond 50%
    position: "relative",
    overflow: "hidden", // Fix for text bleeding into next page on Android
  },
  polaroidContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  polaroid: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 4,
    ...SHADOWS.medium,
    // Slight rotation for realistic effect
    transform: [{ rotate: "-2deg" }],
    maxWidth: SCREEN_HEIGHT * 0.87, // In landscape, height is smaller dimension
    maxHeight: SCREEN_HEIGHT * 0.97,
  },
  photo: {
    width: SCREEN_HEIGHT * 0.67,
    height: SCREEN_HEIGHT * 0.67,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  placeholderPhoto: {
    width: SCREEN_HEIGHT * 0.67,
    height: SCREEN_HEIGHT * 0.67,
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
  narrativeWrapper: {
    flex: 1,
    width: "100%",
    marginBottom: 40,
    overflow: "hidden",
  },
  narrativeContainer: {
    flex: 1,
    width: "100%",
  },
  narrativeContent: {
    flexGrow: 1,
    paddingRight: 20,
    paddingBottom: 20, // Extra padding at bottom
  },
  narrativeText: {
    fontSize: 20,
    lineHeight: 32,
    color: "#2C2416", // Dark brown for good contrast
    fontFamily: "Georgia", // Serif font for nostalgic feel
    textAlign: "left",
    width: "100%",
    flexWrap: "wrap",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 10,
    right: 30,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
});
