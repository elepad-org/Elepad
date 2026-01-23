import { useState, useEffect } from "react";
import { StatusBar, ScrollView, View, StyleSheet, Platform } from "react-native";
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

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Verificar si hay un token válido en la URL (solo una vez)
  useEffect(() => {
    const checkToken = async () => {
      console.log('🔍 Iniciando verificación de token...');
      try {
        // En web, los tokens vienen en el hash
        let accessToken = '';
        let refreshToken = '';
        let type = '';

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Parsear el hash de la URL
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          accessToken = params.get('access_token') || '';
          refreshToken = params.get('refresh_token') || '';
          type = params.get('type') || '';
          
          console.log('📝 Hash parseado:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken,
            type 
          });
        }

        if (accessToken && type === 'recovery') {
          console.log('🔑 Token de recuperación encontrado, estableciendo sesión...');
          
          // Establecer la sesión con el token de recuperación
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          console.log('📊 Resultado de setSession:', { hasData: !!data, hasError: !!error });

          if (error) {
            console.error('❌ Error setting session:', error);
            showToast({
              message: "El enlace de recuperación no es válido o ha expirado",
              type: "error",
            });
            setTokenValid(false);
            setCheckingToken(false);
          } else {
            console.log('✅ Sesión establecida correctamente');
            setTokenValid(true);
            setCheckingToken(false);
          }
        } else {
          console.log('⚠️ No se encontró token válido');
          showToast({
            message: "No se encontró un enlace de recuperación válido",
            type: "error",
          });
          setTokenValid(false);
          setCheckingToken(false);
        }
      } catch (error) {
        console.error('💥 Error in checkToken:', error);
        setTokenValid(false);
        setCheckingToken(false);
      }
    };

    checkToken();
  }, []); // Solo ejecutar una vez al montar

  const validatePasswords = () => {
    if (!newPassword.trim()) {
      showToast({
        message: "Ingresa una nueva contraseña",
        type: "error",
      });
      return false;
    }

    if (newPassword.length < 6) {
      showToast({
        message: "La contraseña debe tener al menos 6 caracteres",
        type: "error",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        message: "Las contraseñas no coinciden",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      showToast({
        message: "Contraseña actualizada correctamente",
        type: "success",
      });

      // Limpiar campos
      setNewPassword("");
      setConfirmPassword("");

      // Redirigir al login después de un momento
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error al actualizar contraseña:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Error al actualizar la contraseña";
      showToast({
        message: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    console.log('⏳ Estado: Verificando token...');
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge">Verificando enlace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tokenValid) {
    console.log('❌ Estado: Token inválido');
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.replace("/login")}
          />
          <Text style={styles.headerTitle}>Enlace inválido</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.centerContainer}>
          <Card style={[STYLES.menuCard, { backgroundColor: COLORS.white }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.errorTitle}>
                Enlace no válido
              </Text>
              <Text variant="bodyMedium" style={styles.errorText}>
                El enlace de recuperación no es válido o ha expirado.
                Por favor, solicita uno nuevo.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.replace("/forgot-password")}
                style={[STYLES.buttonPrimary, { marginTop: 16 }]}
                contentStyle={STYLES.buttonContent}
              >
                Solicitar nuevo enlace
              </Button>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ Estado: Mostrando formulario de cambio de contraseña');
  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.replace("/login")}
        />
        <Text style={styles.headerTitle}>Nueva contraseña</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[STYLES.menuCard, { backgroundColor: COLORS.white }]}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.description}>
              Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Nueva contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                mode="flat"
                outlineColor="transparent"
                activeOutlineColor="transparent"
                style={{ backgroundColor: "transparent" }}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? "eye-off" : "eye"}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Confirmar nueva contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                mode="flat"
                outlineColor="transparent"
                activeOutlineColor="transparent"
                style={{ backgroundColor: "transparent" }}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
            </View>

            <Text variant="bodySmall" style={styles.hint}>
              • La contraseña debe tener al menos 6 caracteres
            </Text>
          </Card.Content>
        </Card>

        <View style={STYLES.container}>
          <Button
            mode="contained"
            onPress={handleUpdatePassword}
            loading={loading}
            disabled={loading}
            style={[STYLES.buttonPrimary, { width: '100%' }]}
            contentStyle={STYLES.buttonContent}
          >
            Actualizar contraseña
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  description: {
    marginBottom: 24,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  hint: {
    marginTop: 8,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: COLORS.error,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
