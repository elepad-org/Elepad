import LogIn from "@/components/Forms/Auth/LogIn";
import NewAccount from "@/components/Forms/Auth/NewAccount";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import React, { useRef, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import elepadCorazonImg from "@/assets/images/elepad_corazon.png";
import logoAzulImg from "@/assets/images/logoazul.png";

export default function ExploreScreen() {
  const theme = useTheme();
  const { session, loading } = useAuth();
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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator animating={true} />;
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          <ImageBackground
            source={elepadCorazonImg}
            resizeMode="center"
            style={{ flex: 1 }}
          >
            <ImageBackground
              source={logoAzulImg}
              resizeMode="contain"
              style={{
                width: 300,
                height: 300,
                marginHorizontal: "15%",
                marginTop: 50,
              }}
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
                      style={styles.sesion}
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
                    <Text variant="titleMedium" style={styles.buttonNew}>
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

  return (
    <View style={styles.container}>
      <Text>Welcome {session.user.email}</Text>
      <Button onPress={handleSignOut}>Sign Out</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfcff",
  },
  title: {
    color: "black",
    fontSize: 42,
    lineHeight: 84,
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    color: "black",
    fontSize: 42,
    lineHeight: 84,
    fontWeight: "bold",
    textAlign: "center",
  },
  sesion: {
    backgroundColor: "#5a8ad3ff",
    width: 250,
    borderRadius: 30,
    marginTop: 300,
  },
  buttonSesion: {
    color: "white",
    fontSize: 30,
    lineHeight: 60,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonNew: {
    color: "#585858ff",
    fontSize: 25,
    lineHeight: 60,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonAqui: {
    color: "#ff3030ff",
    fontSize: 25,
    lineHeight: 60,
    fontWeight: "bold",
    textAlign: "center",
  },
});
