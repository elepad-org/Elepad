import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { COLORS, FONT } from "@/styles/base";
import { useGetMemories } from "@elepad/api-client";
import { useMemo } from "react";

interface BookCoverProps {
  bookId: string;
  groupId: string;
  color: string;
  title: string;
}

// Posiciones y rotaciones predefinidas para los stickers
const stickerPositions = [
  { top: "35%", left: "9%", rotation: -10, size: 80 },
  { top: "38%", right: "12%", rotation: 8, size: 80 },
  { top: "57%", left: "18%", rotation: -12, size: 80 },
  { top: "57%", right: "9%", rotation: 9, size: 78 },
];

export default function BookCover({ bookId, groupId, color, title }: BookCoverProps) {
  const { data: memoriesResponse } = useGetMemories(
    {
      groupId,
      bookId,
      limit: 10,
    },
    {
      query: {
        enabled: !!groupId && !!bookId,
      },
    }
  );

  // Extraer los datos de la respuesta
  const memoriesPayload =
    memoriesResponse && "data" in memoriesResponse
      ? (memoriesResponse as unknown as { data: unknown }).data
      : undefined;

  const memoriesData = Array.isArray(memoriesPayload)
    ? memoriesPayload
    : memoriesPayload &&
      typeof memoriesPayload === "object" &&
      "data" in (memoriesPayload as Record<string, unknown>)
      ? (memoriesPayload as { data: unknown }).data
      : [];

  const memories = Array.isArray(memoriesData) ? memoriesData : [];

  // Filtrar solo las memorias con imágenes
  const imageMemories = useMemo(
    () =>
      memories
        .filter(
          (m: { mimeType?: string; mediaUrl?: string }) =>
            m.mimeType?.startsWith("image/") && m.mediaUrl
        )
        .slice(0, 4),
    [memories]
  );

  return (
    <View style={styles.container}>
      {/* Imagen del baúl de fondo */}
      <Image
        source={require("@/assets/images/baul.png")}
        style={styles.chestImage}
      />
      
      {/* Imágenes de memorias como stickers */}
      {imageMemories.map((memory: { id: string; mediaUrl: string }, index: number) => {
        const position = stickerPositions[index];
        const stickerStyle: any = {
          top: position.top,
          transform: [{ rotate: `${position.rotation}deg` }],
        };
        if (position.left) stickerStyle.left = position.left;
        if (position.right) stickerStyle.right = position.right;
        
        return (
          <View
            key={memory.id}
            style={[styles.stickerContainer, stickerStyle]}
          >
            <Image
              source={{ uri: memory.mediaUrl }}
              style={[styles.stickerImage, { width: position.size, height: position.size }]}
              contentFit="cover"
            />
          </View>
        );
      })}
      
      {/* Título superpuesto */}
      <View style={styles.titleContainer}>
        <Text numberOfLines={2} style={styles.chestTitle}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  chestImage: {
    position: "absolute",
    width: "140%",
    height: "140%",
    resizeMode: "cover",
    transform: [{ scale: 1.05 }],
  },
  titleContainer: {
    position: "absolute",
    top: "45%",
    left: "10%",
    right: "10%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },
  chestTitle: {
    fontSize: 18,
    fontFamily: FONT.regular,
    textAlign: "center",
    color: "#ac8548",
    backgroundColor: "#3c271d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  stickerContainer: {
    position: "absolute",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  stickerImage: {
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#fff",
  },
});
