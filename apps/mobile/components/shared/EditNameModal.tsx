import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, Modal, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import CancelButton from "./CancelButton";
import SaveButton from "./SaveButton";
import { StyledTextInput } from "./StyledTextInput";

interface EditNameModalProps {
  visible: boolean;
  onDismiss: () => void;
  currentName: string;
  userId: string;
  onSuccess?: () => void;
  showToast?: (options: { message: string; type: "success" | "error" }) => void;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({
  visible,
  onDismiss,
  currentName,
  userId,
  onSuccess,
  showToast: showToastProp,
}) => {
  const defaultShowToast = (options: {
    message: string;
    type: "success" | "error";
  }) => {
    console.log(`Toast: ${options.type} - ${options.message}`);
  };

  const showToast = showToastProp || defaultShowToast;
  const [formName, setFormName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  // Actualizar el formName cuando cambia currentName
  useEffect(() => {
    if (visible) {
      setFormName(currentName);
    }
  }, [visible, currentName]);

  const handleSave = async () => {
    const next = formName.trim();

    if (!next) {
      showToast({
        message: "El nombre no puede estar vacío",
        type: "error",
      });
      return;
    }

    if (!userId) {
      showToast({
        message: "Error: No se encontró el ID del usuario",
        type: "error",
      });
      return;
    }

    if (next === currentName) {
      onDismiss();
      return;
    }

    try {
      setSaving(true);
      await patchUsersId(userId, {
        displayName: next,
      });

      showToast({
        message: "Nombre actualizado correctamente",
        type: "success",
      });

      onDismiss();

      if (onSuccess) {
        await onSuccess();
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al actualizar el nombre";
      showToast({
        message: msg,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    setFormName(currentName);
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
          <Text style={modalStyles.title}>
            Editar nombre
          </Text>
          <View style={{ paddingBottom: 15, paddingTop: 8 }}>
            <Text variant="bodyMedium" style={styles.description}>
              Ingresa tu nuevo nombre
            </Text>

            <StyledTextInput
              label="Nombre"
              value={formName}
              onChangeText={setFormName}
              autoFocus
              marginBottom={0}
            />
          </View>
          <View style={modalStyles.actions}>
            <View style={{ width: 120 }}>
              <CancelButton onPress={handleDismiss} disabled={saving} />
            </View>
            <View style={{ width: 120 }}>
              <SaveButton
                onPress={handleSave}
                loading={saving}
                disabled={
                  saving ||
                  !formName.trim() ||
                  formName.trim() === currentName
                }
                text="Guardar"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: 20,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: "center",
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
    backgroundColor: COLORS.background,
    width: "90%",
    borderRadius: 16,
    padding: 24,
    paddingVertical: 20,
    maxWidth: 500,
  },
  title: {
    ...STYLES.heading,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 30,
  },
});
