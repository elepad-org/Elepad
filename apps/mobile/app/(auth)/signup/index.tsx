import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native-paper";
import bh from "@/assets/images/bh7.jpeg";
import { FONT } from "@/styles/base";

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
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <View style={styles.imageContainer}>
        <Image source={bh} contentFit="cover" style={styles.backgroundImage} />
        <Animated.View style={[styles.contentOverlay, { opacity: fadeAnim }]}>
          <NewAccount />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  contentOverlay: {
    flex: 1,
    position: "relative",
    zIndex: 1,
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
