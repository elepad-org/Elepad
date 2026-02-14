import { useAuth } from "@/hooks/useAuth";
import { LoadingUser } from "@/components/shared";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { Animated, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import EleSvg from "@/assets/images/ele.svg";
import { COLORS, STYLES } from "@/styles/base";
import { useTour } from "@/hooks/useTour";
import { useToast } from "@/components/shared/Toast";

export default function IndexRedirect() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasRedirected = useRef(false);
  const [resetTaps, setResetTaps] = useState(0);
  const { resetAllTours } = useTour({ tourId: 'home' });
  const { showToast } = useToast();

  // Dimensiones responsive
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const logoSize = screenWidth * 0.5; // 50% del ancho de pantalla
  const logoMarginTop = screenHeight * 0.12; // 12% del alto de pantalla
  const brandFontSize = screenWidth * 0.16; // 16% del ancho de pantalla

  // Mejorar redirección para que también funcione cuando la sesión se carga después
  useEffect(() => {
    // Redirigir solo si hay sesión, no está cargando, y no se ha redirigido aún
    if (session && !loading && !hasRedirected.current) {
      console.log("🏠 Redirigiendo a home desde index (sesión detectada)");
      hasRedirected.current = true;
      router.replace("/(tabs)/home");
    }
    
    // Reset del flag si la sesión se pierde (por ejemplo, logout)
    if (!session && !loading) {
      hasRedirected.current = false;
    }
  }, [session, loading, router]);


  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingUser />
      </View>
    );
  }

  // Si hay sesión, mostrar loading mientras redirige
  if (session) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingUser />
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
          <Text style={STYLES.subheading}>
            Elija una{" "}
            <Text
              onPress={async () => {
                const newTaps = resetTaps + 1;
                setResetTaps(newTaps);
                if (newTaps >= 5) {
                  setResetTaps(0);
                  await resetAllTours();
                  showToast({
                    message: 'Tours reseteados correctamente',
                    type: 'success'
                  });
                }
              }}
              suppressHighlighting={true}
              style={STYLES.subheading}
            >
              opción
            </Text>
            {" "}para continuar
          </Text>

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
