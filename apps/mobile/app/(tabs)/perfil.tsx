import { useMemo, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  List,
  Portal,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { EditNameDialog, UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import {ThemedSafeAreaView} from "@/components/ThemedSafeAreaView";

export default function PerfilScreen() {
  const { userElepad, refreshUserElepad } = useAuth();
  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";
  const { colors } = useTheme();

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
    <ThemedSafeAreaView style={styles.safeArea}>
      <Appbar.Header
        mode="center-aligned"
        elevated
        style={{ backgroundColor: colors.primary }}
      >
        <Appbar.Content title="Perfil" color={colors.onPrimary} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <ProfileHeader
          name={displayName}
          email={email}
          avatarUrl={avatarUrl}
          onEditPhoto={() => setPhotoOpen(true)}
        />

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
          <EditNameDialog
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
            style={[styles.successSnackbar, { backgroundColor: colors.primary }]}
          >
            ✓ Perfil actualizado
          </Snackbar>
        </Portal>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  successSnackbar: {},
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
