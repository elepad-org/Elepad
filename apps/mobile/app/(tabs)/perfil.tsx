import React, { useMemo, useState } from "react";
import { SafeAreaView, StatusBar, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  Snackbar,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { EditNameDialog, UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import { useRouter } from "expo-router";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function PerfilScreen() {
  const router = useRouter();

  const { userElepad, refreshUserElepad, signOut } = useAuth();
  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";

  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
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
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={baseStyles.contentContainer}>
        <ProfileHeader
          name={displayName}
          email={email}
          avatarUrl={avatarUrl}
          onEditPhoto={() => setPhotoOpen(true)}
        />

        <Card style={baseStyles.menuCard}>
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
              onPress={() => {
                router.navigate("/familyGroup");
              }}
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

        <View style={baseStyles.footer}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => {
              setFormName(displayName);
              setEditOpen(true);
            }}
            contentStyle={baseStyles.buttonContent}
            style={baseStyles.buttonPrimary}
          >
            Editar perfil
          </Button>

          <Button
            mode="contained"
            icon="logout"
            onPress={async () => {
              await signOut();
              router.replace("/");
            }}
            contentStyle={baseStyles.buttonContent}
            style={[baseStyles.buttonPrimary, { backgroundColor: "#fca5a5" }]}
          >
            Cerrar sesión
          </Button>
        </View>
        <Portal>
          <EditNameDialog
            title="Editar nombre"
            visible={editOpen}
            name={formName}
            saving={saving}
            disabled={
              saving ||
              !formName.trim() ||
              !userElepad?.id ||
              formName.trim() === displayName
            }
            onChange={setFormName}
            onCancel={() => setEditOpen(false)}
            onSubmit={async () => {
              const next = formName.trim();
              if (!next || !userElepad?.id) return;
              if (next === displayName) return;
              try {
                setSaving(true);
                await patchUsersId(userElepad.id, { displayName: next });
                setEditOpen(false);
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
          />

          <UpdatePhotoDialog
            visible={photoOpen}
            userId={userElepad?.id || ""}
            displayName={displayName}
            initials={initials}
            currentAvatarUrl={avatarUrl}
            onClose={() => setPhotoOpen(false)}
            onReopen={() => setPhotoOpen(true)}
            onSuccess={async () => {
              await refreshUserElepad?.();
              setSnackbarVisible(true);
            }}
          />
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
          >
            ✓ Perfil actualizado
          </Snackbar>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
