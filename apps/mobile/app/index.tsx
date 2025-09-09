import { useAuth } from "@/hooks/useAuth";
import { Redirect, useRouter } from "expo-router";
import { useRef } from "react";
import { Animated, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import heroImage from "@/assets/images/ele-gray.png";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
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
    <SafeAreaView
      style={baseStyles.safeAreaLogin}
      edges={["top", "left", "right"]}
    >
      <View style={baseStyles.container}>
        <View style={baseStyles.logoWrapWithMargin}>
          <Image
            source={heroImage}
            style={baseStyles.logo}
            resizeMode="contain"
          />
          <Text style={baseStyles.brand}> Elepad </Text>
        </View>
        <View style={baseStyles.separatorWrap}>
          <View style={baseStyles.separator} />
        </View>
        <Animated.View style={[baseStyles.card, { opacity: fadeAnim }]}>
          <Text style={baseStyles.heading}>¡Bienvenido!</Text>
          <Text style={baseStyles.subheading}>
            Elija una opción para continuar
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
            onLongPress={() => router.push("/signup")}
            contentStyle={baseStyles.buttonContent}
            style={[
              baseStyles.buttonPrimary,
              { backgroundColor: COLORS.white },
            ]}
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
