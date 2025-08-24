import React, { useState } from "react";
import { Alert, View } from "react-native";
import { Avatar, Button, Dialog, Text, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { patchUserFormData } from "@elepad/api-client/src/multipart";

type EditNameDialogProps = {
  visible: boolean;
  name: string;
  saving?: boolean;
  disabled?: boolean;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void> | void;
};

export function EditNameDialog({
  visible,
  name,
  saving,
  disabled,
  onChange,
  onCancel,
  onSubmit,
}: EditNameDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onCancel}>
      <Dialog.Title>Editar nombre</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Nombre"
          mode="outlined"
          value={name}
          onChangeText={onChange}
          left={<TextInput.Icon icon="account" />}
          autoFocus
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onCancel}>Cancelar</Button>
        <Button
          mode="contained"
          loading={!!saving}
          disabled={!!disabled}
          onPress={onSubmit}
        >
          Guardar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

type UpdatePhotoDialogProps = {
  visible: boolean;
  userId: string;
  displayName: string;
  initials: string;
  currentAvatarUrl?: string;
  onClose: () => void;
  onReopen: () => void;
  onSuccess?: () => void;
};

export function UpdatePhotoDialog({
  visible,
  userId,
  displayName,
  initials,
  currentAvatarUrl,
  onClose,
  onReopen,
  onSuccess,
}: UpdatePhotoDialogProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    uri: string;
    name: string;
    type: string;
  }>(null);
  const [saving, setSaving] = useState(false);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const openGallery = async () => {
    try {
      // cerrar el modal un instante para dispositivos Android
      const wasOpen = visible;
      if (wasOpen) onClose();
      await sleep(150);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Concede acceso a tus fotos para elegir una imagen."
        );
        if (wasOpen) setTimeout(() => onReopen(), 0);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]) {
        const a = res.assets[0];
        setSelectedPhoto({
          uri: a.uri,
          name: a.fileName || "avatar.jpg",
          type: a.mimeType || "image/jpeg",
        });
      }
      if (wasOpen) setTimeout(() => onReopen(), 0);
    } catch (err) {
      console.warn("ImagePicker error:", err);
      Alert.alert("Error", "No se pudo abrir la galería.");
      setTimeout(() => onReopen(), 0);
    }
  };

  return (
    <Dialog visible={visible} onDismiss={onClose}>
      <Dialog.Title>Actualizar foto de perfil</Dialog.Title>
      <Dialog.Content>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {selectedPhoto ? (
            <Avatar.Image size={96} source={{ uri: selectedPhoto.uri }} />
          ) : currentAvatarUrl ? (
            <Avatar.Image size={96} source={{ uri: currentAvatarUrl }} />
          ) : (
            <Avatar.Text size={96} label={initials} />
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Button mode="outlined" icon="image" onPress={openGallery}>
            Galería
          </Button>
          <Button
            mode="outlined"
            icon="camera"
            onPress={async () => {
              const wasOpen = visible;
              if (wasOpen) onClose();
              await sleep(150);
              const camPerm = await ImagePicker.requestCameraPermissionsAsync();
              if (camPerm.status !== "granted") {
                Alert.alert(
                  "Permiso requerido",
                  "Concede acceso a la cámara para tomar una foto."
                );
                if (wasOpen) setTimeout(() => onReopen(), 0);
                return;
              }
              const res = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.9,
              });
              if (!res.canceled && res.assets?.[0]) {
                const a = res.assets[0];
                setSelectedPhoto({
                  uri: a.uri,
                  name: a.fileName || "avatar.jpg",
                  type: a.mimeType || "image/jpeg",
                });
              }
              if (wasOpen) setTimeout(() => onReopen(), 0);
            }}
          >
            Cámara
          </Button>
        </View>
        <Text style={{ marginTop: 4, color: "#6b7280" }}>
          Selecciona una imagen desde tu dispositivo. Aún no se guardará nada
          hasta confirmar.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button
          onPress={() => {
            setSelectedPhoto(null);
            onClose();
          }}
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          loading={saving}
          disabled={!selectedPhoto || !userId || saving}
          onPress={async () => {
            if (!selectedPhoto || !userId) return;
            try {
              setSaving(true);
              const form = new FormData();
              form.append("displayName", displayName);
              form.append("avatarFile", {
                uri: selectedPhoto.uri,
                name: selectedPhoto.name,
                type: selectedPhoto.type,
              } as unknown as Blob);
              await patchUserFormData(userId, form);
              onClose();
              setSelectedPhoto(null);
              onSuccess?.();
            } catch (e) {
              console.warn(e);
            } finally {
              setSaving(false);
            }
          }}
        >
          Guardar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
