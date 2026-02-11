import { useState } from "react";
import { StatusBar, ScrollView, View, StyleSheet, Keyboard } from "react-native";
import { Button, Card, TextInput, Text, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      showToast({
        message: "Ingresa tu contraseña actual",
        type: "error",
      });
      return false;
    }

    if (!newPassword.trim()) {
      showToast({
        message: "Ingresa una nueva contraseña",
        type: "error",
      });
      return false;
    }

    if (newPassword.length < 6) {
      showToast({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
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

    if (currentPassword === newPassword) {
      showToast({
        message: "La nueva contraseña debe ser diferente a la actual",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    // Cerrar el teclado primero y esperar un momento
    Keyboard.dismiss();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      // Obtener usuario y email actual
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user?.email) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      const userEmail = userData.user.email;

      // Primero verificar la contraseña actual haciendo un reauthentication
      // Esto usa la API de verifyOtp que no genera eventos de sesión
      const { error: reauthError } = await supabase.auth.reauthenticate();

      if (reauthError) {
        // Si reauthenticate no está disponible, verificar manualmente
        // Hacemos una llamada REST directa en lugar de signInWithPassword
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
              email: userEmail,
              password: currentPassword,
            }),
          }
        );

        if (!response.ok) {
          showToast({
            message: "La contraseña actual es incorrecta",
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      showToast({
        message: "Contraseña actualizada correctamente",
        type: "success",
      });

      // Limpiar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Navegar de vuelta después de mostrar el mensaje
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: unknown) {
      console.error("Error al cambiar contraseña:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "Error al cambiar la contraseña";
      showToast({
        message: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Cambiar contraseña</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={[STYLES.contentContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={[STYLES.menuCard, { backgroundColor: COLORS.white }]}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.description}>
              Ingresa tu contraseña actual y la nueva contraseña que deseas
              utilizar.
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Contraseña actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                mode="flat"
                outlineColor="transparent"
                activeOutlineColor="transparent"
                style={{ backgroundColor: "transparent" }}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? "eye-off" : "eye"}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
              />
            </View>

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
            onPress={handleChangePassword}
            loading={loading}
            disabled={
              loading ||
              !currentPassword.trim() ||
              !newPassword.trim() ||
              !confirmPassword.trim() ||
              newPassword.length < 6 ||
              newPassword !== confirmPassword
            }
            style={STYLES.buttonPrimary}
            contentStyle={STYLES.buttonContent}
          >
            Cambiar contraseña
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
});
