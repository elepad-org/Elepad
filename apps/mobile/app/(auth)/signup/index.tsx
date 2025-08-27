import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, useTheme } from "react-native-paper";
import bh from "@/assets/images/bh5.png";
import { ThemedSafeAreaView } from "@/components/ThemedSafeAreaView";

export default function SignupScreen() {
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return (
    <ThemedSafeAreaView style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground source={bh} resizeMode="cover" style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <NewAccount />
        </Animated.View>
      </ImageBackground>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
