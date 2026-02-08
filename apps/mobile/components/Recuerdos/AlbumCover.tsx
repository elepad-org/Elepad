import { View, StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { FONT, COLORS } from "@/styles/base";
import albumLogoImage from "@/assets/images/album-logo.webp";

interface AlbumCoverProps {
  title: string;
  coverImageUrl?: string | null;
}

export default function AlbumCover({ title, coverImageUrl }: AlbumCoverProps) {
  return (
    <View style={styles.container}>
      {/* Imagen del álbum de fondo */}
      <Image
        source={albumLogoImage}
        style={styles.albumImage}
        contentFit="contain"
      />
      
      {/* Recuadro con la cover image del álbum en el centro */}
      {coverImageUrl && (
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
        </View>
      )}
      
      {/* Título superpuesto */}
      <View style={styles.titleContainer}>
        <Text numberOfLines={2} style={styles.albumTitle}>
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
    width: "30%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 0,
    //borderColor: COLORS.border,
    // Centrar en el espacio disponible del álbum (aproximadamente en el centro)
    top: "22.7%",
    alignSelf: "center",
    zIndex: 2,
    justifyContent: "center"
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    position: "absolute",
    bottom: "14%",
    left: "10%",
    right: "10%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    //width: "50%",
  },
  albumTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    textAlign: "center",
    color: "#ffffff",
    width: "50%",
  },
});
