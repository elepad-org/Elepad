import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { FONT } from "@/styles/base";
import albumLogoImage from "@/assets/images/album-leviatan.webp";
import tapeImage from "@/assets/images/paper-transparent-sticky-tape-png.png";

interface AlbumCoverProps {
  title: string;
  /** Remote URL string or a local require/import source */
  coverImageUrl?: string | number | null;
}

export default function AlbumCover({ title, coverImageUrl }: AlbumCoverProps) {
  const [isTwoLines, setIsTwoLines] = useState(false);

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
      <View style={[styles.titleContainer, { top: isTwoLines ? "10%" : "13%" }]}> 
        <Text
          numberOfLines={2}
          style={styles.albumTitle}
          onTextLayout={(e) => setIsTwoLines(e.nativeEvent.lines.length >= 2)}
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
    top: "10%",
    left: "8%",
    right: "10%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    //width: "50%",
  },
  albumTitle: {
    fontSize: 14,
    fontFamily: FONT.semiBold,
    textAlign: "center",
    color: "#000000",
    width: "67%",
  },
});
