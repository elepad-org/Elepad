import { useState } from "react";
import { StatusBar, View, StyleSheet, ImageBackground, Platform } from "react-native";
import {
  Button,
  TextInput,
  Text,
} from "react-native-paper";
import { useRouter, Link } from "expo-router";
import { COLORS } from "@/styles/base";
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
      style={[styles.container, { backgroundColor: "#FFFFFF" }]}
      resizeMode="cover"
      imageStyle={{ opacity: 0.60 }}
    >
      <StatusBar />

      <View style={styles.formContainer}>
        <View style={styles.innerForm}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Ingresa tu email para recibir un enlace de recuperación</Text>

          {!emailSent ? (
            <>
              <TextInput
                mode="outlined"
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                outlineColor="rgba(203, 203, 203, 0.92)"
                activeOutlineColor={COLORS.textLight}
                textColor={COLORS.text}
                placeholderTextColor={COLORS.textSecondary}
                disabled={loading}
                dense
              />

              <Button
                mode="contained"
                contentStyle={styles.buttonContent}
                style={styles.primaryButton}
                buttonColor={COLORS.primary}
                onPress={handleSendResetEmail}
                loading={loading}
                disabled={loading || !email.trim()}
              >
                Enviar correo de recuperación
              </Button>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>
                ✓ Correo enviado
              </Text>
              <Text style={styles.successText}>
                Revisa tu bandeja de entrada. El enlace te llevará a una página
                donde podrás establecer tu nueva contraseña.
              </Text>
              <Text style={[styles.successText, { marginTop: 16, fontStyle: 'italic' }]}>
                Nota: Si no recibes el correo en unos minutos, revisa tu carpeta
                de spam o espera unos minutos antes de intentar de nuevo.
              </Text>
            </View>
          )}

          <Link
            href={{ pathname: "/login" }}
            accessibilityRole="button"
            style={styles.backLink}
          >
            <Text style={styles.backText}>Volver</Text>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  innerForm: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 14,
    backgroundColor: "transparent",
  },
  inputOutline: {
    borderRadius: 12,
  },
  primaryButton: {
    marginTop: 8,
    width: "100%",
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
  successContainer: {
    alignItems: "center",
    width: "100%",
  },
  successTitle: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 20,
    textAlign: "center",
  },
  successText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  backLink: {
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
