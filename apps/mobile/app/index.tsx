import { useAuth } from "@/hooks/useAuth";
import { Redirect, useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, View, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import logoBlue from "@/assets/images/lombriz.png";
import { useState } from "react";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [view, getView] = useState<"buttons" | "login" | "newaccount">(
    "buttons",
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (loading) {
    return (
      <View style={baseStyles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView
          style={baseStyles.safeAreaLogin}
          edges={["top", "left", "right"]}
        >
          <View style={baseStyles.container}>
            <View
              style={[
                baseStyles.logoWrapWithMargin,
                view !== "buttons" && { marginTop: 10 }, // sube el logo cuando hay formulario
              ]}
            >
              <Image
                source={logoBlue}
                style={baseStyles.logo}
                resizeMode="contain"
              />
              <Text style={baseStyles.brand}>Elepad</Text>
            </View>
            <View style={baseStyles.separatorWrap}>
              <View style={baseStyles.separator} />
            </View>
            <Animated.View style={[baseStyles.card, { opacity: fadeAnim }]}>
              {view === "buttons" && (
                <>
                  <Text style={baseStyles.heading}>¡Bienvenido!</Text>
                  <Text style={baseStyles.subheading}>
                    Elige una opción para continuar
                  </Text>

                  <Button
                    mode="contained"
                    onPress={() => router.push("/login")}
                    contentStyle={baseStyles.buttonContent}
                    style={baseStyles.buttonPrimary}
                    accessibilityLabel="Ir a iniciar sesión"
                  >
                    Iniciar Sesión
                  </Button>

                  <Button
                    mode="contained"
                    onPress={() => router.push("/signup")}
                    contentStyle={baseStyles.buttonContent}
                    style={baseStyles.buttonSecondary}
                    labelStyle={{ color: "#333" }}
                    accessibilityLabel="Ir a crear cuenta"
                  >
                    Crear Cuenta
                  </Button>
                </>
              )}
            </Animated.View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}
