import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useRef } from "react";
import { Animated, StyleSheet, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { FONT } from "@/styles/base";
import fondoLogin from "@/assets/images/pirotecnia.png";

export default function SignupScreen() {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  return (
    <ImageBackground
      source={fondoLogin}
      style={[styles.container, { backgroundColor: "#FFFFFF" }]}
      resizeMode="cover"
      imageStyle={{ opacity: 0.60 }}
    >
      <StatusBar style="light" translucent />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <NewAccount />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    width: 300,
    height: 300,
    marginHorizontal: "15%",
    marginTop: 50,
  },
  title: { color: "white", textAlign: "center", fontFamily: FONT.bold },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  buttonNew: { fontFamily: FONT.bold, textAlign: "center", lineHeight: 60 },
  buttonAqui: {
    fontFamily: FONT.bold,
    textAlign: "center",
    lineHeight: 60,
    textDecorationLine: "underline",
  },
});
