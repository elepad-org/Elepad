import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
  Alert,
} from "react-native";
import {
  Appbar,
  Avatar,
  IconButton,
  Button,
  Card,
  Divider,
  List,
  Text,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@elepad/api-client/src/gen/client";
import * as ImagePicker from "expo-image-picker";
import { patchUserFormData } from "@elepad/api-client/src/multipart";

const colors = {
  primary: "#7fb3d3",
  white: "#f9f9f9ff",
  background: "#F4F7FF",
};

export default function PerfilScreen() {
  const { userElepad, refreshUserElepad } = useAuth();
  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";

  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const openGallery = async () => {
    try {
      // Cerrar el diálogo para evitar conflictos con el picker nativo en Android (un dolor de cabeza)
      const wasOpen = photoOpen;
      if (wasOpen) setPhotoOpen(false);
      await sleep(150);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Concede acceso a tus fotos para elegir una imagen."
        );
        if (wasOpen) setPhotoOpen(true);
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
      if (wasOpen) setPhotoOpen(true);
    } catch (err) {
      console.warn("ImagePicker error:", err);
      Alert.alert("Error", "No se pudo abrir la galería.");
      setPhotoOpen(true);
    }
  };
  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Appbar.Header
        mode="center-aligned"
        elevated
        style={{ backgroundColor: colors.primary }}
      >
        <Appbar.Content title="Perfil" color="#fff" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Avatar.Image size={112} source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Text size={112} label={initials} />
            )}
            <IconButton
              icon="pencil"
              size={16}
              onPress={() => {
                setPhotoOpen(true);
              }}
              iconColor="#fff"
              containerColor={colors.primary}
              style={styles.avatarBadge}
            />
          </View>
          <Text variant="titleLarge" style={styles.name}>
            {displayName}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {email}
          </Text>
        </View>

        <Card style={styles.menuCard} mode="elevated">
          <List.Section>
            <List.Item
              title="Editar perfil"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setFormName(displayName);
                setEditOpen(true);
              }}
            />
            <Divider />
            <List.Item
              title="Notificaciones"
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Grupo familiar"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Cambiar contraseña"
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </List.Section>
        </Card>

        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => {
              setFormName(displayName);
              setEditOpen(true);
            }}
            contentStyle={styles.bottomButtonContent}
            style={styles.bottomButton}
          >
            Editar perfil
          </Button>
        </View>
        <Portal>
          {/* Dialog: editar nombre */}
          <Dialog visible={editOpen} onDismiss={() => setEditOpen(false)}>
            <Dialog.Title>Editar nombre</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nombre"
                mode="outlined"
                value={formName}
                onChangeText={setFormName}
                left={<TextInput.Icon icon="account" />}
                autoFocus
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setEditOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                loading={saving}
                disabled={
                  saving ||
                  !formName.trim() ||
                  !userElepad?.id ||
                  formName.trim() === displayName
                }
                onPress={async () => {
                  const next = formName.trim();
                  if (!next || !userElepad?.id) return;
                  if (next === displayName) return;
                  try {
                    setSaving(true);
                    await updateUser(userElepad.id, { displayName: next });
                    setEditOpen(false);
                    // Actualizar datos globales
                    await refreshUserElepad?.();
                    setSnackbarVisible(true);
                  } catch (e: unknown) {
                    const msg =
                      e instanceof Error ? e.message : "Error al actualizar";
                    console.warn(msg);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Guardar
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Dialog: actualizar foto de perfil */}
          <Dialog visible={photoOpen} onDismiss={() => setPhotoOpen(false)}>
            <Dialog.Title>Actualizar foto de perfil</Dialog.Title>
            <Dialog.Content>
              <View style={styles.photoPreviewContainer}>
                {selectedPhoto ? (
                  <Avatar.Image size={96} source={{ uri: selectedPhoto.uri }} />
                ) : avatarUrl ? (
                  <Avatar.Image size={96} source={{ uri: avatarUrl }} />
                ) : (
                  <Avatar.Text size={96} label={initials} />
                )}
              </View>
              <View style={styles.photoActionsRow}>
                <Button mode="outlined" icon="image" onPress={openGallery}>
                  Galería
                </Button>
                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={async () => {
                    const camPerm =
                      await ImagePicker.requestCameraPermissionsAsync();
                    if (camPerm.status !== "granted") return;
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
                  }}
                >
                  Cámara
                </Button>
              </View>
              <Text style={styles.helperText}>
                Selecciona una imagen desde tu dispositivo. Aún no se guardará
                nada hasta confirmar.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setSelectedPhoto(null);
                  setPhotoOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                loading={photoSaving}
                disabled={!selectedPhoto || !userElepad?.id || photoSaving}
                onPress={async () => {
                  if (!selectedPhoto || !userElepad?.id) return;
                  try {
                    setPhotoSaving(true);
                    const form = new FormData();
                    // displayName opcional: mantener
                    form.append("displayName", displayName);
                    // En React Native, el objeto debe tener uri, name y type
                    form.append("avatarFile", {
                      uri: selectedPhoto.uri,
                      name: selectedPhoto.name,
                      type: selectedPhoto.type,
                    } as unknown as Blob);
                    await patchUserFormData(userElepad.id, form);
                    setPhotoOpen(false);
                    setSelectedPhoto(null);
                    await refreshUserElepad?.();
                    setSnackbarVisible(true);
                  } catch (e) {
                    console.warn(e);
                  } finally {
                    setPhotoSaving(false);
                  }
                }}
              >
                Guardar
              </Button>
            </Dialog.Actions>
          </Dialog>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
            style={styles.successSnackbar}
          >
            ✓ Perfil actualizado
          </Snackbar>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-start",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    textAlign: "center",
  },
  subtitle: {
    color: "#667085",
    textAlign: "center",
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
  },
  bottomButton: {
    borderRadius: 10,
  },
  bottomButtonContent: {
    height: 48,
  },
  successSnackbar: {
    backgroundColor: "green",
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  photoActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  helperText: {
    marginTop: 4,
    color: "#6b7280",
  },
});
