import { useState } from "react";
import { StatusBar, ScrollView, View, StyleSheet, ImageBackground, Platform } from "react-native";
import {
  Button,
  Card,
  TextInput,
  Text,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import { supabase } from "@/lib/supabase";
import fondoLogin from "@/assets/images/pirotecnia.png";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      showToast({
        message: "Por favor ingresa tu correo electrónico",
        type: "error",
      });
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast({
        message: "Por favor ingresa un correo electrónico válido",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Detectar entorno automáticamente
      let redirectUrl = 'https://ele.expo.app/(auth)/update-password'; // Producción por defecto
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Si estamos en localhost, usar la URL local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          redirectUrl = `http://localhost:${port}/(auth)/update-password`;
          console.log('🏠 Entorno de desarrollo detectado, usando:', redirectUrl);
        } else {
          console.log('🌍 Entorno de producción detectado, usando:', redirectUrl);
        }
      }
      
      console.log('📧 Enviando email de recuperación con redirectTo:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      showToast({
        message: "Se ha enviado un correo para recuperar tu contraseña",
        type: "success",
      });

      // Esperar un poco antes de volver
      setTimeout(() => {
        router.back();
      }, 3000);
    } catch (error: unknown) {
      console.error("Error al enviar email de recuperación:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Error al enviar el correo de recuperación";
      showToast({
        message: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={fondoLogin}
      style={styles.background}
      resizeMode="cover"
      imageStyle={{ opacity: 0.60 }}
    >
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={COLORS.text}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Recuperar contraseña</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Card style={styles.card}>
              <Card.Content>
                {!emailSent ? (
                  <>
                    <Text variant="bodyMedium" style={styles.description}>
                      Ingresa tu correo electrónico y te enviaremos un enlace para
                      restablecer tu contraseña.
                    </Text>

                    <View style={styles.inputWrapper}>
                      <TextInput
                        label="Correo electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        mode="flat"
                        outlineColor="transparent"
                        activeOutlineColor="transparent"
                        style={{ backgroundColor: "transparent" }}
                        disabled={loading}
                      />
                    </View>

                    <Button
                      mode="contained"
                      onPress={handleSendResetEmail}
                      loading={loading}
                      disabled={loading || !email.trim()}
                      style={[STYLES.buttonPrimary, { width: '100%' }]}
                      contentStyle={STYLES.buttonContent}
                    >
                      Enviar correo de recuperación
                    </Button>
                  </>
                ) : (
                  <View style={styles.successContainer}>
                    <Text variant="titleMedium" style={styles.successTitle}>
                      ✓ Correo enviado
                    </Text>
                    <Text variant="bodyMedium" style={styles.successText}>
                      Revisa tu bandeja de entrada. El enlace te llevará a una página
                      donde podrás establecer tu nueva contraseña.
                    </Text>
                    <Text variant="bodySmall" style={[styles.successText, { marginTop: 16, fontStyle: 'italic' }]}>
                      Nota: Si no recibes el correo en unos minutos, revisa tu carpeta
                      de spam o espera unos minutos antes de intentar de nuevo.
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    elevation: 4,
  },
  description: {
    marginBottom: 24,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successTitle: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 20,
  },
  successText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
