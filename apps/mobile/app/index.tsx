import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { Animated, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import EleSvg from "@/assets/images/ele.svg";
import { COLORS, STYLES } from "@/styles/base";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasRedirected = useRef(false);

  // Si hay sesión, redirigir a home una sola vez
  useEffect(() => {
    if (session && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/home");
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // Si hay sesión, mostrar loading mientras redirige
  if (session) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={STYLES.safeAreaLogin}>
      <View style={STYLES.container}>
        <View style={STYLES.logoWrapWithMargin}>
          <EleSvg width={200} height={200} style={STYLES.logo} />
          <Text style={STYLES.brand}> Elepad </Text>
        </View>
        <View style={STYLES.separatorWrap}>
          <View style={STYLES.separator} />
        </View>
        <Animated.View
          style={[
            {
              width: "100%",
              marginTop: 16,
              padding: 20,
              borderRadius: 20,
              alignItems: "center",
            },
            { opacity: fadeAnim },
          ]}
        >
          <Text style={STYLES.heading}>¡Bienvenido!</Text>
          <Text style={STYLES.subheading}>Elija una opción para continuar</Text>

          <Button
            mode="contained"
            onPress={() => router.push("/login")}
            contentStyle={STYLES.buttonContent}
            style={STYLES.buttonPrimary}
            accessibilityLabel="Ir a iniciar sesión"
          >
            Iniciar Sesión
          </Button>

          <Button
            mode="contained"
            onPress={() => router.push("/signup")}
            onLongPress={() => router.push("/signup")}
            contentStyle={STYLES.buttonContent}
            style={[STYLES.buttonPrimary, { backgroundColor: COLORS.white }]}
            labelStyle={{ color: COLORS.text }}
            accessibilityLabel="Ir a crear cuenta"
          >
            Crear Cuenta
          </Button>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
