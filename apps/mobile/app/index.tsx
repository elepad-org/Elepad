import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { Animated, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import EleSvg from "@/assets/images/ele.svg";
import { COLORS, STYLES } from "@/styles/base";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from "@/components/shared/Toast";

import HomeScreen from "./(tabs)/home";
export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasRedirected = useRef(false);
  const { showToast } = useToast();

  // Dimensiones responsive
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const logoSize = screenWidth * 0.5; // 50% del ancho de pantalla
  const logoMarginTop = screenHeight * 0.12; // 12% del alto de pantalla
  const brandFontSize = screenWidth * 0.16; // 16% del ancho de pantalla

  // Si hay sesión, redirigir a home una sola vez
  useEffect(() => {
    if (session && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/home");
    }
  }, [session, loading]);

  const handleResetTours = async () => {
    try {
      await AsyncStorage.removeItem('@elepad_has_seen_home_tour_v2');
      await AsyncStorage.removeItem('@elepad_has_seen_calendar_tour_v2');
      showToast({
        message: 'Tours de onboarding eliminados del storage',
        type: 'success'
      });
    } catch (e) {
      console.error('Error clearing tour storage', e);
      showToast({
        message: 'Error al eliminar los tours',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <HomeScreen />
      </View>
    );
  }

  // Si hay sesión, mostrar loading mientras redirige
  if (session) {
    return (
      <View style={{ flex: 1 }}>
        <HomeScreen />
      </View>
    );
  }

  return (
    <SafeAreaView style={STYLES.safeAreaLogin}>
      <View style={STYLES.container}>
        <View style={[STYLES.logoWrap, { marginTop: logoMarginTop }]}>
          <EleSvg
            width={logoSize}
            height={logoSize}
            style={STYLES.logo}
          />
          <Text style={[STYLES.brand, { fontSize: brandFontSize }]}> Elepad </Text>
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

          {/* Botón provisional para resetear tours */}
          <Button
            mode="outlined"
            onPress={handleResetTours}
            contentStyle={STYLES.buttonContent}
            style={[STYLES.buttonPrimary, { marginTop: 20, borderColor: COLORS.primary, borderWidth: 1 }]}
            labelStyle={{ color: COLORS.primary }}
            accessibilityLabel="Resetear tours de onboarding"
          >
            🔄 Resetear Tours (Dev)
          </Button>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
