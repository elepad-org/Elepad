import LogIn from "@/components/Forms/Auth/LogIn";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, Link } from "expo-router";
import { useRef } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import bh from "@/assets/images/bh.jpeg";

export default function LoginScreen() {
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const theme = useTheme();

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
      <ImageBackground
        source={bh}
        resizeMode="cover"
        style={{ flex: 1 }}
      >

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <LogIn />
          <View style={styles.registerRow}>
            <Text
              variant="titleMedium"
              style={[styles.buttonNew, { color: "white" }]}
            >
              ¿No tienes cuenta?{" "}
            </Text>
            <Link
              href={{ pathname: "/signup" }}
              accessibilityRole="button"
              style={styles.buttonAqui}
            >
              <Text
                variant="titleMedium"
                style={[
                  styles.buttonAqui,
                  {
                    color: theme.colors.primary,
                    textDecorationLine: "underline",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Crear cuenta nueva"
              >
                Crear una
              </Text>
            </Link>
          </View>
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
  title: { color: "white", textAlign: "center", fontWeight: "bold" },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  buttonNew: { fontWeight: "bold", textAlign: "center", lineHeight: 60 },
  buttonAqui: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 60,
    textDecorationLine: "underline",
  },
});
