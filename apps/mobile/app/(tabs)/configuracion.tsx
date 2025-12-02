import { useMemo, useState, useEffect } from "react";
import { StatusBar, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  TextInput,
  Switch,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { UpdatePhotoDialog } from "@/components/PerfilDialogs";
import ProfileHeader from "@/components/ProfileHeader";
import SuccessSnackbar from "@/components/shared/SuccessSnackbar";
import ErrorSnackbar from "@/components/shared/ErrorSnackbar";
import { useRouter } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

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
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success",
  );
  const [photoOpen, setPhotoOpen] = useState(false);
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [loadingGoogleCalendar, setLoadingGoogleCalendar] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");

  // Check for OAuth callback on component mount
  useEffect(() => {
    const checkOAuthCallback = () => {
      const callback = (
        globalThis as {
          googleCalendarOAuthCallback?: { code: string; state: string };
        }
      ).googleCalendarOAuthCallback;
      if (callback) {
        // Clear the callback data
        delete (
          globalThis as {
            googleCalendarOAuthCallback?: { code: string; state: string };
          }
        ).googleCalendarOAuthCallback;

        // Process the callback
        handleGoogleCalendarCallback(callback.code, callback.state);
      }
    };

    // Check immediately
    checkOAuthCallback();

    // Also check periodically for a short time
    const interval = setInterval(checkOAuthCallback, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000); // Stop after 10 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Sync status indicator component
  const SyncStatusIndicator = () => {
    if (syncStatus === "idle") return null;

    const colors = {
      syncing: COLORS.secondary,
      success: COLORS.success,
      error: COLORS.error,
    };

    return (
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
      >
        <MaterialIcons name="sync" size={16} color={colors[syncStatus]} />
        <Text
          style={{
            color: colors[syncStatus],
            marginLeft: 4,
            fontSize: 12,
          }}
        >
          {syncStatus === "syncing" ? "Sincronizando..." : `Sync ${syncStatus}`}
        </Text>
      </View>
    );
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

  const handleGoogleCalendarToggle = async () => {
    if (!userElepad?.id) return;

    const newValue = !googleCalendarEnabled;

    if (newValue) {
      // Enable Google Calendar - start OAuth flow
      await startGoogleCalendarOAuth();
    } else {
      // Disable Google Calendar
      await disableGoogleCalendar();
    }
  };

  const startGoogleCalendarOAuth = async () => {
    if (!userElepad?.id) return;

    setLoadingGoogleCalendar(true);
    setSyncStatus("syncing");

    try {
      // Get OAuth authorization URL
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/oauth/google-calendar/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const { authUrl } = await response.json();

      // Open browser for OAuth consent
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Constants.expoConfig?.extra?.scheme || "elepad",
      );

      if (result.type === "success") {
        // Parse callback URL to extract authorization code
        const url = result.url;
        const urlParams = new URLSearchParams(url.split("?")[1] || "");
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        if (code && state === userElepad.id) {
          // Handle OAuth callback
          await handleGoogleCalendarCallback(code, state);
        } else {
          throw new Error("Invalid OAuth response");
        }
      } else {
        throw new Error("OAuth cancelled or failed");
      }
    } catch (error) {
      console.error("Error in Google Calendar OAuth:", error);
      setSyncStatus("error");
      setSnackbarMessage("Error al autorizar Google Calendar");
      setSnackbarType("error");
      setSnackbarVisible(true);
    } finally {
      setLoadingGoogleCalendar(false);
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  const handleGoogleCalendarCallback = async (code: string, state: string) => {
    if (!userElepad?.id || state !== userElepad.id) {
      console.error("Invalid OAuth state");
      return;
    }

    setLoadingGoogleCalendar(true);
    setSyncStatus("syncing");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/oauth/google-calendar/callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to handle OAuth callback");
      }

      // Now enable Google Calendar sync
      await enableGoogleCalendar();
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      setSyncStatus("error");
      setSnackbarMessage("Error al conectar Google Calendar");
      setSnackbarType("error");
      setSnackbarVisible(true);
    }
  };

  const enableGoogleCalendar = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/activities/google-calendar/enable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({}),
        },
      );

      if (response.ok) {
        setGoogleCalendarEnabled(true);
        setSyncStatus("success");
        setSnackbarMessage("Google Calendar habilitado");
        setSnackbarType("success");
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to enable Google Calendar",
        );
      }
    } catch (error) {
      console.error("Error enabling Google Calendar:", error);
      setSyncStatus("error");
      setSnackbarMessage("Error al habilitar Google Calendar");
      setSnackbarType("error");
    } finally {
      setSnackbarVisible(true);
      setLoadingGoogleCalendar(false);
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  const disableGoogleCalendar = async () => {
    setLoadingGoogleCalendar(true);
    setSyncStatus("syncing");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/activities/google-calendar/disable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        },
      );

      if (response.ok) {
        setGoogleCalendarEnabled(false);
        setSyncStatus("success");
        setSnackbarMessage("Google Calendar deshabilitado");
        setSnackbarType("success");
      } else {
        throw new Error("Failed to disable Google Calendar");
      }
    } catch (error) {
      console.error("Error disabling Google Calendar:", error);
      setSyncStatus("error");
      setSnackbarMessage("Error al deshabilitar Google Calendar");
      setSnackbarType("error");
    } finally {
      setSnackbarVisible(true);
      setLoadingGoogleCalendar(false);
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  };

  // Helper function to get auth token
  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
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
              title="Google Calendar"
              description="Sincronizar actividades"
              left={(props) => <List.Icon {...props} icon="calendar" />}
              right={() => (
                <View>
                  <SyncStatusIndicator />
                  <Switch
                    value={googleCalendarEnabled}
                    onValueChange={handleGoogleCalendarToggle}
                    disabled={loadingGoogleCalendar}
                  />
                </View>
              )}
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
            style={[
              STYLES.buttonPrimary,
              { backgroundColor: COLORS.secondary },
            ]}
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
          {snackbarType === "success" ? (
            <SuccessSnackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              message={snackbarMessage}
            />
          ) : (
            <ErrorSnackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              message={snackbarMessage}
            />
          )}
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
