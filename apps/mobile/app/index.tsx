import { useAuth } from "@/hooks/useAuth";
import { Redirect, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { Button, Text, ActivityIndicator, useTheme } from "react-native-paper";
import logoBlue from "@/assets/images/bbb.png";
import { useState } from "react";
import { ThemedSafeAreaView } from "@/components/ThemedSafeAreaView";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [view, getView] = useState<"buttons" | "login" | "newaccount">(
    "buttons",
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <>
      <ThemedSafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View
            style={[
              styles.logoWrap,
              view !== "buttons" && { marginTop: 10 }, // sube el logo cuando hay formulario
            ]}
          >
            <Image
              source={logoBlue}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="displayLarge" style={[styles.brand, { color: colors.onSurface }]}>ELEPAD</Text>
          </View>
          <View style={styles.separatorWrap}>
            <View style={[styles.separator, { backgroundColor: colors.onSurface }]} />
          </View>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            {view === "buttons" && (
              <>
                <Text variant="headlineSmall" style={[styles.heading, { color: colors.onSurface }]}>¡Bienvenido!</Text>
                <Text variant="bodyLarge" style={[styles.subheading, { color: colors.onSurfaceVariant }]}>
                  Elige una opción para continuar
                </Text>

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
                  mode="text"
                  onPress={() => router.push("/signup")}
                  contentStyle={styles.secondaryContent}
                  style={[styles.secondaryButton, { backgroundColor: colors.secondary }]}
                  labelStyle={styles.secondaryLabel}
                  accessibilityLabel="Ir a crear cuenta"
                >
                  Crear Cuenta
                </Button>
              </>
            )}
          </Animated.View>
        </View>
      </ThemedSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoWrap: { alignItems: "center", marginTop: 115 },
  logo: { width: 185, height: 185 },
  brand: {
    marginTop: 20,
    letterSpacing: 8,
  },
  separatorWrap: { width: "100%", alignItems: "center", marginTop: 6 },
  separator: { width: "60%", height: 1, opacity: 0.9 },
  card: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  heading: {
    marginTop: 6,
  },
  subheading: {
    marginTop: 8,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 20,
    width: "100%",
    borderRadius: 8,
  },
  primaryContent: { height: 48 },
  primaryLabel: { fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    marginTop: 14,
    width: "100%",
    borderRadius: 8,
  },
  secondaryContent: { height: 48 },
  secondaryLabel: { fontSize: 16, fontWeight: "600" },
});
