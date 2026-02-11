import { useMemo, useState } from "react";
import {
  StatusBar,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Pressable,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  Dialog,
  Icon,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import { LoadingProfile, ChangePasswordModal, EditNameModal } from "@/components/shared";
import { useRouter } from "expo-router";
import { COLORS, STYLES, FONT } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    userElepad,
    refreshUserElepad,
    signOut,
    userElepadLoading,
    updateUserTimezone,
  } = useAuth();

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
        <LoadingProfile />
      </SafeAreaView>
    );
  }

  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";
  const activeFrameUrl = userElepad?.activeFrameUrl;

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [timezone, setTimezone] = useState(
    userElepad?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [timezoneDialogVisible, setTimezoneDialogVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
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
    "America/Argentina/Buenos_Aires",
    "America/New_York",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Madrid",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  // Función para formatear zona horaria de manera amigable
  const formatTimezone = (tz: string) => {
    const timezoneNames: Record<string, string> = {
      "America/Argentina/Buenos_Aires": "Argentina - Buenos Aires",
      "America/New_York": "Estados Unidos - Nueva York",
      "America/Los_Angeles": "Estados Unidos - Los Ángeles",
      "America/Mexico_City": "México - Ciudad de México",
      "America/Sao_Paulo": "Brasil - São Paulo",
      "Europe/London": "Reino Unido - Londres",
      "Europe/Paris": "Francia - París",
      "Europe/Madrid": "España - Madrid",
      "Europe/Berlin": "Alemania - Berlín",
      "Asia/Tokyo": "Japón - Tokio",
      "Asia/Shanghai": "China - Shanghái",
      "Australia/Sydney": "Australia - Sídney",
      "Pacific/Auckland": "Nueva Zelanda - Auckland",
    };
    return timezoneNames[tz] || tz;
  };

  // Ordenar timezones alfabéticamente por nombre formateado
  const sortedTimezones = timezones.sort((a, b) => {
    const nameA = formatTimezone(a);
    const nameB = formatTimezone(b);
    return nameA.localeCompare(nameB);
  });

  const handleSaveTimezone = async (tz: string) => {
    if (!userElepad?.id) return;

    // Actualizar optimísticamente el timezone en el estado sin loading
    updateUserTimezone(tz);

    try {
      await patchUsersId(userElepad.id, { timezone: tz });
      showToast({
        message: "Zona horaria actualizada correctamente",
        type: "success",
      });
    } catch (e: unknown) {
      // Si falla, revertir al timezone original
      updateUserTimezone(
        userElepad.timezone || "America/Argentina/Buenos_Aires",
      );
      const msg =
        e instanceof Error ? e.message : "Error al actualizar zona horaria";
      showToast({
        message: msg,
        type: "error",
      });
    }
  };

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header with back button */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <Pressable 
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            padding: 8,
            marginRight: 8,
          })}
        >
          <Icon source="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: "600", 
          color: COLORS.text,
          fontFamily: FONT.bold,
        }}>
          Configuración
        </Text>
      </View>

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
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              style={{ minHeight: 60, justifyContent: "center" }}
              onPress={() => setEditNameModalVisible(true)}
            />
            <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
            <List.Item
              title="Cambiar contraseña"
              left={(props) => <List.Icon {...props} icon="lock-reset" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              style={{ minHeight: 60, justifyContent: "center" }}
              onPress={() => {
                setChangePasswordModalVisible(true);
              }}
            />
            <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
            {/* <List.Item
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
            /> */}
            <List.Item
              title="Zona horaria"
              description={formatTimezone(timezone)}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              style={{ minHeight: 60, justifyContent: "center" }}
              onPress={() => setTimezoneDialogVisible(true)}
            />
            <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
            <List.Item
              title="Grupo familiar"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              style={{ minHeight: 60, justifyContent: "center" }}
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
            onPress={signOut}
            contentStyle={STYLES.buttonContent}
            style={STYLES.buttonPrimary}
          >
            Cerrar sesión
          </Button>
        </View>
        <Portal>
          <Dialog
            visible={timezoneDialogVisible}
            onDismiss={() => setTimezoneDialogVisible(false)}
            style={{ backgroundColor: COLORS.white }}
          >
            <Dialog.Title style={{ textAlign: "center" }}>
              Seleccionar zona horaria
            </Dialog.Title>
            <Dialog.Content style={{ maxHeight: 300, paddingHorizontal: 0 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {sortedTimezones.map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,

                      backgroundColor:
                        timezone === tz
                          ? COLORS.backgroundSecondary
                          : COLORS.white,
                    }}
                    onPress={() => {
                      setTimezone(tz);
                      setTimezoneDialogVisible(false);
                      handleSaveTimezone(tz);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: COLORS.text,
                        fontWeight: timezone === tz ? "600" : "400",
                        fontFamily: FONT.regular,
                      }}
                    >
                      {formatTimezone(tz)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
          <ChangePasswordModal
            visible={changePasswordModalVisible}
            onDismiss={() => setChangePasswordModalVisible(false)}
            showToast={showToast}
          />
          <EditNameModal
            visible={editNameModalVisible}
            onDismiss={() => setEditNameModalVisible(false)}
            currentName={displayName}
            userId={userElepad?.id || ""}
            onSuccess={async () => {
              await refreshUserElepad?.();
            }}
            showToast={showToast}
          />
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
