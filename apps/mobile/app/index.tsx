import { useAuth } from "@/hooks/useAuth";
import { LoadingUser } from "@/components/shared";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { Animated, View, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import EleImage from "@/assets/images/ele-def.png";
import { COLORS, STYLES } from "@/styles/base";
import { useTour } from "@/hooks/useTour";
import { useToast } from "@/components/shared/Toast";
import { supabase } from "@/lib/supabase";

export default function IndexRedirect() {
  const { session, loading, userElepad } = useAuth();
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

  useEffect(() => {
    // Si ya hay sesión Y usuario elepad cargado con grupo, intentar redirigir
    // Esto es un "safety net" por si el redirect de useAuth falló o si el usuario
    // ya estaba cargado al montar este componente.
    if (session && !loading && userElepad && userElepad.groupId && !hasRedirected.current) {
       console.log("🏠 Redirigiendo a home desde index (sesión y usuario listos)");
       hasRedirected.current = true;
       router.replace("/(tabs)/home");
    }
  }, [session, loading, userElepad, router]);


  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingUser />
      </View>
    );
  }

  if (session) {
    // Si falla la carga del usuario Elepad (no existe a pesar de tener sesión),
    // debemos dar una salida al usuario.
    // Esto ocurre si userElepad es null pero loading es false.
    if (!loading && !userElepad) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
             <Image
                source={EleImage}
                style={{ width: 100, height: 100, marginBottom: 20 }}
                resizeMode="contain"
             />
             <Text style={{ ...STYLES.heading, textAlign: "center", marginBottom: 10 }}>Algo salió mal</Text>
             <Text style={{ ...STYLES.subheading, textAlign: "center", marginBottom: 24 }}>
                No pudimos cargar tu perfil de usuario. Esto puede ocurrir si hubo un problema durante el registro.
             </Text>
             
             <Button 
                mode="contained" 
                onPress={() => {
                   // Forzar recarga completa
                   router.replace("/");
                   // O forzar cierre de sesión para intentar entrar de nuevo
                   supabase.auth.signOut();
                }}
                style={{ marginBottom: 12, width: "100%" }}
             >
                Volver al inicio
             </Button>
        </View>
      );
    }
    
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
          <Image
            source={EleImage}
            style={[STYLES.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
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
