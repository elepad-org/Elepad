import LogIn from "@/components/Forms/Auth/LogIn";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
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
});
