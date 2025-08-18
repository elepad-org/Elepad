import LogIn from "@/components/Forms/Auth/LogIn";
import NewAccount from "@/components/Forms/Auth/NewAccount";
import React, { useState, useRef } from "react";
import { ImageBackground, StyleSheet, View, Animated } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Text, useTheme } from "react-native-paper";
import elephantsImg from "@/assets/images/elefantes_juntos.png";
import logoImg from "@/assets/images/logoblanco.png";

export default function HomeScreen() {
  const theme = useTheme();
  const [view, setView] = useState<"buttons" | "login" | "newaccount">(
    "buttons",
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToView = (target: "buttons" | "login" | "newaccount") => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setView(target);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
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
                <View
                  style={{ flexDirection: "row", justifyContent: "center" }}
                >
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

                <View
                  style={{ flexDirection: "row", justifyContent: "center" }}
                >
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
  logoContainer: {
    width: 300,
    height: 300,
    marginHorizontal: "15%",
    marginTop: 50,
  },
  title: {
    color: "white",
    textAlign: "center",
    // original sizes approximated with MD3 variants + style
    fontWeight: "bold",
  },
  sessionButton: {
    width: 250,
    borderRadius: 30,
    marginTop: 300,
  },
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
