import { useAuth } from "@/hooks/useAuth";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import logoBlue from "@/assets/images/bbb.png";
import { useState } from "react";
import NewAccount from "@/components/Forms/Auth/NewAccount";
import LogIn from "@/components/Forms/Auth/LogIn";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"buttons" | "login" | "newaccount">("buttons"); 
   const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToView = (target: "buttons" | "login" | "newaccount") => { Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => { setView(target); Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(); }); };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return <> 
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <View style={[styles.logoWrap, 
            (view !== "buttons") && { marginTop: 10 } // sube el logo cuando hay formulario
          ]}>
            <Image source={logoBlue} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>ELEPAD</Text>
          </View>
          <View style={styles.separatorWrap}>
            <View style={styles.separator} />
          </View>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>            
            {view === "buttons" && ( 
            <>
            <Text style={styles.heading}>¡Bienvenido!</Text>
            <Text style={styles.subheading}>Elige una opción para continuar</Text>

            <Button
              mode="contained"
              onPress={() => router.push("/login")}
              contentStyle={styles.primaryContent}
              style={styles.primaryButton}
              labelStyle={styles.primaryLabel}
              accessibilityLabel="Ir a iniciar sesión"
            >
              Iniciar Sesión
            </Button>

            <Button
              mode="contained"
              onPress={() => router.push("/signup")}
              contentStyle={styles.secondaryContent}
              style={styles.secondaryButton}
              labelStyle={styles.secondaryLabel}
              accessibilityLabel="Ir a crear cuenta"
            >
              Crear Cuenta
            </Button>
            </> )}  
          </Animated.View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  </>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF9F1" },
  container: { flex: 1, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoWrap: { alignItems: "center", marginTop: 115 },
  logo: { width: 185, height: 185 },
  brand: {
    marginTop: 20,
    fontSize: 44,
    fontWeight: "400",
    letterSpacing: 8,
    fontFamily: "Montserrat",
  },
  separatorWrap: { width: "100%", alignItems: "center", marginTop: 6 },
  separator: { width: "60%", height: 1, backgroundColor: "#111", opacity: 0.9 },
  card: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  heading: { fontSize: 18, fontWeight: "600", marginTop: 6, fontFamily: "Montserrat" },
  subheading: { fontSize: 13, color: "#666", marginTop: 8, textAlign: "center", fontFamily: "Montserrat", fontWeight: "600" },
  primaryButton: { marginTop: 20, width: "100%", borderRadius: 8, backgroundColor: "#5278CD" },
  primaryContent: { height: 48 },
  primaryLabel: { fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    marginTop: 14,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryContent: { height: 48 },
  secondaryLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
});

