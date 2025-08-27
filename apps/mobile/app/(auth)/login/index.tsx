import LogIn from "@/components/Forms/Auth/LogIn";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native-paper";
import bh from "@/assets/images/bh5.png";
import { FONT } from "@/styles/theme";

export default function LoginScreen() {
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
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground source={bh} resizeMode="cover" style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <LogIn />
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoContainer: {
    width: 300,
    height: 300,
    marginHorizontal: "15%",
    marginTop: 50,
  },
  title: { color: "white", textAlign: "center", fontFamily: FONT.bold },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  buttonNew: { fontFamily: FONT.semiBold, textAlign: "center", lineHeight: 60 },
  buttonAqui: {
    fontFamily: FONT.bold,
    textAlign: "center",
    lineHeight: 60,
    textDecorationLine: "underline",
  },
  inlineBack: {
    marginTop: 22,
    textAlign: "center",
    fontFamily: FONT.regular,
    fontSize: 14,
    color: "#666",
  },
});
