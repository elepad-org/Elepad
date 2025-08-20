import LogIn from "@/components/Forms/Auth/LogIn";
import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import elephantsImg from "@/assets/images/elefantes_juntos.png";
import logoImg from "@/assets/images/logoblanco.png";

export default function LandingScreen() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [view, setView] = useState<"buttons" | "login" | "newaccount">(
    "buttons"
  );
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

  const goToView = (target: "buttons" | "login" | "newaccount") => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setView(target);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <ImageBackground
          source={elephantsImg}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <ImageBackground
            source={logoImg}
            resizeMode="contain"
            style={styles.logoContainer}
          >
            <Text variant="headlineLarge" style={styles.title}>
              ELEPAD
            </Text>
          </ImageBackground>

          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {view === "buttons" && (
              <>
                <View style={styles.buttonsRow}>
                  <Button
                    mode="contained"
                    icon="login"
                    onPress={() => goToView("login")}
                    style={styles.sessionButton}
                    contentStyle={{ height: 60 }}
                    labelStyle={{ fontSize: 20, fontWeight: "bold" }}
                    accessibilityLabel="Iniciar sesión"
                  >
                    Iniciar Sesión
                  </Button>
                </View>

                <View style={styles.registerRow}>
                  <Text
                    variant="titleMedium"
                    style={[styles.buttonNew, { color: "white" }]}
                  >
                    Si eres nuevo, haz click{" "}
                  </Text>
                  <Text
                    variant="titleMedium"
                    onPress={() => goToView("newaccount")}
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
                    aquí
                  </Text>
                </View>
              </>
            )}

            {view === "login" && <LogIn onBack={() => goToView("buttons")} />}
            {view === "newaccount" && (
              <NewAccount onBack={() => goToView("buttons")} />
            )}
          </Animated.View>
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
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
  title: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  sessionButton: {
    width: 250,
    borderRadius: 30,
    marginTop: 300,
  },
  buttonsRow: { flexDirection: "row", justifyContent: "center" },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  buttonNew: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 60,
  },
  buttonAqui: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 60,
  },
});
