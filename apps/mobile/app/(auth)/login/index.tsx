import LogIn from "@/components/Forms/Auth/LogIn";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native-paper";
import bh from "@/assets/images/bh7.jpeg";

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
      <StatusBar />
      <View style={styles.imageContainer}>
        <Image source={bh} contentFit="cover" style={styles.backgroundImage} />
        <Animated.View style={[styles.contentOverlay, { opacity: fadeAnim }]}>
          <LogIn />
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
});
