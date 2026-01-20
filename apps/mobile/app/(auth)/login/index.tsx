import LogIn from "@/components/Forms/Auth/LogIn";
import { useRef } from "react";
import { Animated, StyleSheet, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import fondoLogin from "@/assets/images/pirotecnia.png";

export default function LoginScreen() {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  return (
    <ImageBackground
      source={fondoLogin}
      style={[styles.container, { backgroundColor: "#FFFFFF" }]}
      resizeMode="cover"
      imageStyle={{ opacity: 0.60 }}
    >
      <StatusBar />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LogIn />
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
});
