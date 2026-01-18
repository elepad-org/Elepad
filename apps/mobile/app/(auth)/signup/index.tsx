import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, StyleSheet, View, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native-paper";
import { FONT } from "@/styles/base";
import fondoLogin from "@/assets/images/pirotecnia.png";

export default function SignupScreen() {
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
