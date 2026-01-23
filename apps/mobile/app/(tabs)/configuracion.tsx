import { useMemo, useState } from "react";
import { StatusBar, ScrollView, View, FlatList } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  TextInput,
  Switch,
  Dialog,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import { LoadingProfile } from "@/components/shared";
import { useRouter } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const { userElepad, refreshUserElepad, signOut, userElepadLoading } =
    useAuth();

  // Mostrar loading si está cargando o si no hay usuario aún
  const showLoading = userElepadLoading || !userElepad;

  // Si está cargando, mostrar solo el spinner centrado
  if (showLoading) {
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <LoadingProfile message="Cargando perfil..." />
      </SafeAreaView>
    );
  }

  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";
  const activeFrameUrl = userElepad?.activeFrameUrl;

  const [editExpanded, setEditExpanded] = useState(false);
  const [formName, setFormName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [loadingGoogleCalendar, setLoadingGoogleCalendar] = useState(false);
  const [timezone, setTimezone] = useState(userElepad?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [timezoneDialogVisible, setTimezoneDialogVisible] = useState(false);
  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const timezones = [
    'America/Argentina/Buenos_Aires',
    'America/New_York',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Madrid',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  const handleGoogleCalendarToggle = async () => {
    if (!userElepad?.id) return;

    setLoadingGoogleCalendar(true);
    try {
      const newValue = !googleCalendarEnabled;
      // TODO: Implement API call to enable/disable Google Calendar
      // For now, just toggle the state
      setGoogleCalendarEnabled(newValue);
      showToast({
        message: `Google Calendar ${newValue ? "habilitado" : "deshabilitado"}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error toggling Google Calendar:", error);
      showToast({
        message: "Error al cambiar configuración de Google Calendar",
        type: "error",
      });
    } finally {
      setLoadingGoogleCalendar(false);
    }
  };

  const handleSaveTimezone = async (tz: string) => {
    if (!userElepad?.id) return;
    try {
      await patchUsersId(userElepad.id, { timezone: tz });
      await refreshUserElepad?.();
      showToast({
        message: "Zona horaria actualizada correctamente",
        type: "success",
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Error al actualizar zona horaria";
      showToast({
        message: msg,
        type: "error",
      });
    }
  };

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
          frameUrl={activeFrameUrl} // Pass the frame URL
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
                        showToast({
                          message: "Nombre actualizado correctamente",
                          type: "success",
                        });
                      } catch (e: unknown) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "Error al actualizar";
                        showToast({
                          message: msg,
                          type: "error",
                        });
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
              title="Google Calendar"
              description="Sincronizar actividades con Google Calendar"
              left={(props) => <List.Icon {...props} icon="calendar" />}
              right={() => (
                <Switch
                  value={googleCalendarEnabled}
                  onValueChange={handleGoogleCalendarToggle}
                  disabled={loadingGoogleCalendar}
                />
              )}
            />
            <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
            <List.Item
              title="Zona horaria"
              description={timezone}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setTimezoneDialogVisible(true)}
            />
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
            style={STYLES.buttonPrimary}
          >
            Cerrar sesión
          </Button>
        </View>
        <Portal>
          <Dialog visible={timezoneDialogVisible} onDismiss={() => setTimezoneDialogVisible(false)}>
            <Dialog.Title>Seleccionar zona horaria</Dialog.Title>
            <Dialog.Content style={{ maxHeight: 300 }}>
              <FlatList
                data={timezones}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <List.Item
                    title={item}
                    onPress={() => {
                      setTimezone(item);
                      setTimezoneDialogVisible(false);
                      handleSaveTimezone(item);
                    }}
                  />
                )}
              />
            </Dialog.Content>
          </Dialog>
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
              showToast({
                message: "Foto actualizada correctamente",
                type: "success",
              });
            }}
          />
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
