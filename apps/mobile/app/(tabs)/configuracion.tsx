import { useMemo, useState } from "react";
import { StatusBar, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  Snackbar,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import { useRouter } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";

export default function ConfiguracionScreen() {
  const router = useRouter();

  const { userElepad, refreshUserElepad, signOut } = useAuth();
  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";

  const [editExpanded, setEditExpanded] = useState(false);
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
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: 120 }, // Espacio para la barra flotante
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={displayName}
          email={email}
          avatarUrl={avatarUrl}
          onEditPhoto={() => setPhotoOpen(true)}
        />

        <Card style={STYLES.menuCard}>
          <List.Section>
            <List.Item
              title="Editar nombre"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => (
                <List.Icon
                  {...props}
                  icon={editExpanded ? "chevron-down" : "chevron-right"}
                />
              )}
              onPress={() => {
                setFormName(displayName);
                setEditExpanded(!editExpanded);
              }}
            />

            {/* Campo de texto desplegable */}
            {editExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  style={STYLES.input}
                  underlineColor="transparent"
                  activeUnderlineColor={COLORS.primary}
                  autoFocus
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Button
                    mode="text"
                    onPress={() => {
                      setEditExpanded(false);
                      setFormName(displayName);
                    }}
                    disabled={saving}
                    style={[
                      STYLES.buttonPrimary,
                      { width: "40%", backgroundColor: COLORS.white },
                    ]}
                    labelStyle={{ color: COLORS.text }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={async () => {
                      const next = formName.trim();
                      if (!next || !userElepad?.id) return;
                      if (next === displayName) {
                        setEditExpanded(false);
                        return;
                      }
                      try {
                        setSaving(true);
                        await patchUsersId(userElepad.id, {
                          displayName: next,
                        });
                        setEditExpanded(false);
                        await refreshUserElepad?.();
                        setSnackbarVisible(true);
                      } catch (e: unknown) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "Error al actualizar";
                        alert(msg);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    loading={saving}
                    disabled={saving}
                    style={[STYLES.buttonPrimary, { width: "40%" }]}
                  >
                    Guardar
                  </Button>
                </View>
              </View>
            )}

            <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
            <List.Item
              title="Grupo familiar"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                router.navigate("/familyGroup");
              }}
            />
          </List.Section>
        </Card>

        <View style={STYLES.container}>
          <Button
            mode="contained"
            icon="logout"
            onPress={async () => {
              await signOut();
              router.replace("/");
            }}
            contentStyle={STYLES.buttonContent}
            style={[STYLES.buttonPrimary, { backgroundColor: COLORS.red }]}
          >
            Cerrar sesión
          </Button>
        </View>
        <Portal>
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
            ✓ Información actualizada correctamente
          </Snackbar>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
