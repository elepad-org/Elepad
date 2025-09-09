import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, ImageBackground, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native-paper";
import bh from "@/assets/images/bh7.jpeg";
import { FONT } from "@/styles/base";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground source={bh} resizeMode="cover" style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <NewAccount />
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
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
  buttonNew: { fontFamily: FONT.bold, textAlign: "center", lineHeight: 60 },
  buttonAqui: {
    fontFamily: FONT.bold,
    textAlign: "center",
    lineHeight: 60,
    textDecorationLine: "underline",
  },
});
