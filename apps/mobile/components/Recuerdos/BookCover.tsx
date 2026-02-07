import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { COLORS, FONT } from "@/styles/base";

interface BookCoverProps {
  bookId: string;
  groupId: string;
  color: string;
  title: string;
}

export default function BookCover({ bookId, groupId, color, title }: BookCoverProps) {
  return (
    <View style={styles.container}>
      {/* Imagen del baúl ocupando todo el espacio */}
      <Image
        source={require("@/assets/images/baul.png")}
        style={styles.chestImage}
      />
      
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
  },
  chestImage: {
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    position: "absolute",
    top: "45%",
    left: "10%",
    right: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  chestTitle: {
    fontSize: 16,
    fontFamily: FONT.regular,
    textAlign: "center",
    color: "#ffffff",
  },

});
