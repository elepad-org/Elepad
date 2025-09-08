import { useState } from "react";
import { Alert, Platform, View } from "react-native";
import {
  Avatar,
  Button,
  Dialog,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { patchUsersIdAvatar } from "@elepad/api-client";
import { uriToBlob } from "@/lib/uriToBlob";

type EditNameDialogProps = {
  title: string;
  visible: boolean;
  name: string;
  saving?: boolean;
  disabled?: boolean;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void> | void;
};

export function EditNameDialog({
  title,
  visible,
  name,
  saving,
  disabled,
  onChange,
  onCancel,
  onSubmit,
}: EditNameDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={onCancel}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title style={{ color: theme.colors.onSurface }}>
        {title}
      </Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Nombre"
          mode="outlined"
          value={name}
          onChangeText={onChange}
          left={<TextInput.Icon icon="account" />}
          autoFocus
          theme={{
            colors: {
              primary: theme.colors.primary,
              outline: theme.colors.outline,
            },
          }}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onCancel} textColor={theme.colors.onSurface}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          loading={!!saving}
          disabled={!!disabled}
          onPress={onSubmit}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
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
  initials,
  currentAvatarUrl,
  onClose,
  onReopen,
  onSuccess,
}: UpdatePhotoDialogProps) {
  const theme = useTheme();
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
          "Concede acceso a tus fotos para elegir una imagen.",
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
    <Dialog
      visible={visible}
      onDismiss={onClose}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title style={{ color: theme.colors.onSurface }}>
        Actualizar foto de perfil
      </Dialog.Title>
      <Dialog.Content>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {selectedPhoto ? (
            <Avatar.Image size={96} source={{ uri: selectedPhoto.uri }} />
          ) : currentAvatarUrl ? (
            <Avatar.Image size={96} source={{ uri: currentAvatarUrl }} />
          ) : (
            <Avatar.Text
              size={96}
              label={initials}
              style={{ backgroundColor: theme.colors.primary }}
              labelStyle={{
                color: theme.colors.onPrimary,
                fontFamily: theme.fonts.titleMedium.fontFamily,
              }}
            />
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
          <Button
            mode="outlined"
            icon="image"
            onPress={openGallery}
            textColor={theme.colors.primary}
            style={{ borderColor: theme.colors.outline }}
          >
            Galería
          </Button>
          <Button
            mode="outlined"
            icon="camera"
            textColor={theme.colors.primary}
            style={{ borderColor: theme.colors.outline }}
            onPress={async () => {
              const wasOpen = visible;
              if (wasOpen) onClose();
              await sleep(150);
              const camPerm = await ImagePicker.requestCameraPermissionsAsync();
              if (camPerm.status !== "granted") {
                Alert.alert(
                  "Permiso requerido",
                  "Concede acceso a la cámara para tomar una foto.",
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
        <Text style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
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
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          onPress={async () => {
            if (!selectedPhoto || !userId) return;
            try {
              setSaving(true);

              if (Platform.OS === "web") {
                // Build blob from local URI
                const blob = await uriToBlob(selectedPhoto.uri);
                await patchUsersIdAvatar(userId, { avatarFile: blob });
              } else {
                // Either React Native or Expo Go have trouble sending a Blob through the `fetch` inside `patchUsersIdAvatar`.
                // However, we can create an object with Blob properties that seems to work well on mobile.
                await patchUsersIdAvatar(userId, {
                  avatarFile: {
                    uri: selectedPhoto.uri,
                    name: selectedPhoto.name,
                    type: selectedPhoto.type,
                  } as unknown as Blob,
                });
              }

              onClose();
              setSelectedPhoto(null);
              onSuccess?.();
            } catch (e) {
              console.warn(e);
              Alert.alert("Error", "No se pudo guardar la imagen.");
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
