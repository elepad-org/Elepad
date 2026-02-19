import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { FONT, COLORS } from "@/styles/base";
import albumLogoImage from "@/assets/images/album-leviatan.webp";
import tapeImage from "@/assets/images/paper-transparent-sticky-tape-png.png";

interface AlbumCoverProps {
  title: string;
  /** Remote URL string or a local require/import source */
  coverImageUrl?: string | number | null;
  /** Use compact styling (smaller font, narrower title) for 2-column grids */
  compact?: boolean;
}

export default function AlbumCover({ title, coverImageUrl, compact = false }: AlbumCoverProps) {
  // Build the source prop: if it's a number it's a local require, otherwise a URI
  const coverSource =
    typeof coverImageUrl === "number"
      ? coverImageUrl
      : coverImageUrl
        ? { uri: coverImageUrl }
        : null;

  return (
    <View style={styles.container}>
      {/* Imagen del álbum de fondo */}
      <Image
        source={albumLogoImage}
        style={styles.albumImage}
        contentFit="contain"
      />
      
      {/* Recuadro con la cover image del álbum en el centro */}
      {coverSource && (
        <View style={styles.coverContainer}>
          <Image
            source={coverSource}
            style={styles.coverImage}
            contentFit="cover"
          />
          
          {/* Cinta superior izquierda */}
          <Image
            source={tapeImage}
            style={[styles.tape, styles.tapeTopleft]}
            contentFit="contain"
          />
          
          {/* Cinta inferior derecha */}
          <Image
            source={tapeImage}
            style={[styles.tape, styles.tapeBottomRight]}
            contentFit="contain"
          />
        </View>
      )}
      
      {/* Título superpuesto */}
      <View style={[styles.titleContainer, compact && styles.titleContainerCompact]}> 
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.albumTitle, compact ? styles.albumTitleCompact : styles.albumTitleLarge]}
        >
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
    overflow: "hidden",
  },
  albumImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverContainer: {
    position: "absolute",
    width: "35%",
    left: "31%",
    
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "visible",
    //backgroundColor: COLORS.white,
    //borderWidth: 0,
    //borderColor: COLORS.border,
    // Centrar en el espacio disponible del álbum (aproximadamente en el centro)
    top: "30.7%",
    alignSelf: "center",
    zIndex: 2,
    justifyContent: "center"
  },
  coverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  tape: {
    position: "absolute",
    width: 60,
    height: 70,
    zIndex: 10,
  },
  tapeTopleft: {
    top: -15,
    left: -25,
    transform: [{ rotate: "-15deg" }],
  },
  tapeBottomRight: {
    bottom: -30,
    right: -25,
    transform: [{ rotate: "5deg" }],
  },
  titleContainer: {
    position: "absolute",
    top: "12.5%",
    left: "8%",
    right: "10%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  titleContainerCompact: {
    top: "11.5%",
  },
  albumTitle: {
    fontFamily: FONT.bold,
    textAlign: "center",
    color: COLORS.primary,
  },
  albumTitleLarge: {
    fontSize: 15,
    width: "67%",
  },
  albumTitleCompact: {
    fontSize: 11,
    width: "58%",
  },
});
