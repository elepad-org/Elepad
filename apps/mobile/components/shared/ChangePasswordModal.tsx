import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { COLORS } from "@/styles/base";
import { supabase } from "@/lib/supabase";
import CancelButton from "./CancelButton";
import SaveButton from "./SaveButton";
import { StyledTextInput } from "./StyledTextInput";

interface ChangePasswordModalProps {
  visible: boolean;
  onDismiss: () => void;
  showToast?: (options: { message: string; type: "success" | "error" }) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onDismiss,
  showToast: showToastProp,
}) => {
  const defaultShowToast = (options: {
    message: string;
    type: "success" | "error";
  }) => {
    console.log(`Toast: ${options.type} - ${options.message}`);
  };

  const showToast = showToastProp || defaultShowToast;

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
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      // Primero verificamos la contraseña actual intentando hacer signIn
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.email) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword,
      });

      if (signInError) {
        showToast({
          message: "La contraseña actual es incorrecta",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Actualizar a la nueva contraseña
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

      // Limpiar campos y cerrar modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onDismiss();
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

  const handleDismiss = () => {
    // Limpiar campos al cerrar
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={modalStyles.container}>
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        <KeyboardAvoidingView
          behavior="padding"
          style={modalStyles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, modalStyles.title]}>Cambiar contraseña</Text>
            <View style={{ paddingBottom: 15 }}>
              <Text variant="bodyMedium" style={styles.description}>
                Ingresa tu contraseña actual y la nueva contraseña que deseas
                utilizar.
              </Text>

              <StyledTextInput
                label="Contraseña actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                marginBottom={16}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? "eye-off" : "eye"}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                }
              />

              <StyledTextInput
                label="Nueva contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                marginBottom={16}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? "eye-off" : "eye"}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />

              <StyledTextInput
                label="Confirmar nueva contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />

              <Text variant="bodySmall" style={styles.hint}>
                • La contraseña debe tener al menos 6 caracteres
              </Text>
            </View>
            <View style={modalStyles.actions}>
              <View style={{ width: 120 }}>
                <CancelButton onPress={handleDismiss} disabled={loading} />
              </View>
              <View style={{ width: 120 }}>
                <SaveButton
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
                  text="Cambiar"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
  },
  description: {
    marginBottom: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  hint: {
    marginTop: 8,
    marginBottom: 16,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    fontSize: 12,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "#ffffff",
    width: "92%",
    borderRadius: 20,
    padding: 24,
    paddingTop: 20,
    maxWidth: 500,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 30,
  },
});
