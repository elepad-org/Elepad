import { useMemo, useState, useEffect } from "react";
import {
  StatusBar,
  ScrollView,
  View,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Portal,
  Dialog,
  Text,
  Modal,
  ActivityIndicator,
} from "react-native-paper";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { patchUsersId } from "@elepad/api-client/src/gen/client";
import { useGetFamilyGroupIdGroupMembers } from "@elepad/api-client";
import { UpdatePhotoDialog } from "@/components/PerfilDialogs";
import eleEnmarcadoImage from "@/assets/images/ele-enmarcado.png";
import ProfileHeader from "@/components/ProfileHeader";
import PolaroidPreview from "@/components/Recuerdos/PolaroidPreview";
import { LoadingProfile, ChangePasswordModal, EditNameModal, BackButton, EditProfileModal } from "@/components/shared";
import { useRouter } from "expo-router";
import { COLORS, STYLES, FONT } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import {
  useGetShopInventory,
  useGetShopItems,
  usePostShopEquip,
  usePostShopUnequip,
} from "@elepad/api-client";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // helper to unwrap react-query results
  const normalizeData = (data: unknown) => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as { data: unknown }).data;
    }
    return data;
  };

  const {
    userElepad,
    refreshUserElepad,
    signOut,
    userElepadLoading,
    updateUserTimezone,
  } = useAuth();
  // shop hooks for frames
  const inventoryResponse = useGetShopInventory();
  const inventoryData = normalizeData(inventoryResponse.data) as
    | Array<{ itemId: string; equipped?: boolean }>
    | undefined;
  const itemsResponse = useGetShopItems();
  const itemsDataRaw = normalizeData(itemsResponse.data);
  const itemsData = Array.isArray(itemsDataRaw) ? itemsDataRaw : [];

  const isLoadingFrames = inventoryResponse.isLoading || itemsResponse.isLoading;

  // derive owned frames
  const ownedFrames = useMemo(() => {
    if (!inventoryData || !itemsData) return [];
    if (!Array.isArray(inventoryData) || !Array.isArray(itemsData)) return [];
    return inventoryData
      .map((inv) => itemsData.find((it: { id: string, type: string }) => it.id === inv.itemId))
      .filter((it: { type: string } | undefined) => it && it.type === "frame") as Array<{
        id: string;
        title: string;
        assetUrl: string;
      }>;
  }, [inventoryData, itemsData]);

  const hasFrames = ownedFrames.length > 0;

  const { mutate: equipItem, isPending: isEquipping } = usePostShopEquip({
    mutation: {
      onSuccess: (res, variables) => {
        showToast({ message: "¡Marco equipado con éxito!", type: "success" });
        // variables.data.itemId contains the id that was equipped
        const equipped = ownedFrames.find((f) => f.id === variables.data.itemId);
        if (equipped) {
          setPreviewFrameUrl(equipped.assetUrl);
        }
        setFrameModalVisible(false);
        refreshUserElepad();
      },
      onError: (error: Error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "No se pudo equipar el marco.";
        Alert.alert("Error", message);
      },
    },
  });

  const { mutate: unequipItem, isPending: isUnequipping } = usePostShopUnequip({
    mutation: {
      onSuccess: () => {
        showToast({ message: "¡Marco desequipado con éxito!", type: "success" });
        setPreviewFrameUrl(null);
        setFrameModalVisible(false);
        refreshUserElepad();
      },
      onError: (error: Error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "No se pudo desequipar el marco.";
        Alert.alert("Error", message);
      },
    },
  });

  // Mostrar loading si está cargando o si no hay usuario aún
  const showLoading = userElepadLoading || !userElepad;

  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";
  const activeFrameUrl = userElepad?.activeFrameUrl;
  const groupId = userElepad?.groupId;

  // Fetch optional group info for the family name
  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId ?? "", {
    query: { enabled: !!groupId },
  });

  // Normaliza la respuesta del hook (envuelta en {data} o directa)
  const groupInfo = (() => {
    const resp = membersQuery.data as unknown; // Quick cast since type is internal
    if (!resp) return undefined;

    type GroupResponse = { data?: { name: string } } | { name: string };
    const checkedResp = resp as GroupResponse;

    if ('name' in checkedResp) {
      return checkedResp;
    }
    return checkedResp.data;
  })();
  const familyName = groupInfo?.name || "Sin familia";

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [timezone, setTimezone] = useState(
    userElepad?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [timezoneDialogVisible, setTimezoneDialogVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
  const [frameModalVisible, setFrameModalVisible] = useState(false);
  const [processingFrameId, setProcessingFrameId] = useState<string | null>(null);
  const [previewFrameUrl, setPreviewFrameUrl] = useState<string | null>(
    activeFrameUrl || null,
  );

  // keep preview in sync when active changes
  useEffect(() => {
    setPreviewFrameUrl(activeFrameUrl || null);
  }, [activeFrameUrl]);

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
      const errMessage = e instanceof Error ? e.message : "Error al actualizar zona horaria";
      showToast({
        message: errMessage,
        type: "error",
      });
    }
  };

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

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header with back button */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: COLORS.background,
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
        }}>
          <BackButton size={28} />
          <Text style={{
            fontSize: 24,
            fontWeight: "bold",
            color: COLORS.text,
            letterSpacing: -0.5,
            flex: 1,
          }}>
            Configuración
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: 120 }, // Espacio para la barra flotante
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={() => setPhotoPreviewVisible(true)}>
          <ProfileHeader
            name={displayName}
            email={email}
            avatarUrl={avatarUrl}
            frameUrl={(frameModalVisible ? previewFrameUrl : activeFrameUrl) || undefined} // convert null to undefined
            onEditPhoto={() => setPhotoOpen(true)}
          />
        </TouchableOpacity>

        <Card style={STYLES.menuCard}>
          <List.Section>
            <List.Item
              title="Editar Perfil"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              style={{ minHeight: 60, justifyContent: "center" }}
              onPress={() => setEditProfileModalVisible(true)}
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
          <Modal
            visible={photoPreviewVisible}
            onDismiss={() => setPhotoPreviewVisible(false)}
            contentContainerStyle={{
              backgroundColor: "transparent",
              margin: 0,
              padding: 0,
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
              activeOpacity={1}
              onPress={() => setPhotoPreviewVisible(false)}
            >
              <PolaroidPreview
                memory={{
                  id: "profile-preview",
                  title: displayName,
                  mediaUrl: avatarUrl || null,
                }}
                hideMeta={true}
                customRows={[
                  { label: "Correo", value: email },
                  { label: "Familia", value: familyName }
                ]}
              />
            </TouchableOpacity>
          </Modal>
          <EditProfileModal
            visible={editProfileModalVisible}
            onDismiss={() => setEditProfileModalVisible(false)}
            displayName={displayName}
            avatarUrl={avatarUrl}
            activeFrameUrl={activeFrameUrl}
            equippedFrameName={ownedFrames.find(f => f.assetUrl === activeFrameUrl)?.title}
            onEditPhotoPress={() => {
              setEditProfileModalVisible(false);
              setPhotoOpen(true);
            }}
            onChangeFramePress={() => {
              setEditProfileModalVisible(false);
              setFrameModalVisible(true);
            }}
            onEditNamePress={() => {
              setEditProfileModalVisible(false);
              setEditNameModalVisible(true);
            }}
          />

          {/* frame picker modal triggered by floating button */}
          <Modal
            visible={frameModalVisible}
            onDismiss={() => setFrameModalVisible(false)}
            contentContainerStyle={{
              backgroundColor: COLORS.white,
              margin: 20,
              borderRadius: 12,
              padding: 16,
              maxHeight: "80%",
            }}
          >
            <Text style={[STYLES.heading, { textAlign: "center" }]}>Elegir marco</Text>
            {isLoadingFrames ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Cargando marcos...</Text>
              </View>
            ) : hasFrames ? (
              <ScrollView>
                {ownedFrames.map((frame, index) => (
                  <Pressable
                    key={frame.id}
                    onPress={() => setPreviewFrameUrl(frame.assetUrl)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: index === ownedFrames.length - 1 ? 0 : 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Image
                      source={{ uri: frame.assetUrl }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      contentFit="contain"
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text>{frame.title}</Text>
                      {activeFrameUrl === frame.assetUrl && (
                        <Text style={{ fontSize: 12, color: COLORS.textPlaceholder, marginTop: 2 }}>
                          Equipado
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", marginLeft: 8 }}>
                      {activeFrameUrl === frame.assetUrl ? (
                        <Button
                          mode="outlined"
                          disabled={isUnequipping || isEquipping}
                          loading={isUnequipping}
                          onPress={() => {
                            unequipItem({ data: { itemType: "frame" } });
                          }}
                        >
                          Desequipar
                        </Button>
                      ) : (
                        <Button
                          mode="contained"
                          disabled={isEquipping || isUnequipping}
                          loading={isEquipping && processingFrameId === frame.id}
                          onPress={() => {
                            setProcessingFrameId(frame.id);
                            equipItem({ data: { itemId: frame.id } });
                          }}
                        >
                          Usar
                        </Button>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 }}>
                <Image
                  source={eleEnmarcadoImage}
                  style={{ width: 180, height: 180, marginBottom: 16 }}
                  contentFit="contain"
                />
                <Text style={{ textAlign: "center", fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, paddingHorizontal: 10 }}>
                  {userElepad?.elder ? (
                    "¡Para obtener divertidos marcos para tu perfil, jugá, obtené puntos y canjealos en la tienda!"
                  ) : (
                    "Para obtener divertidos marcos para tu perfil, pídele a tus Adultos Mayores que te lo obsequien desde la tienda."
                  )}
                </Text>
                {userElepad?.elder && (
                  <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", width: "100%" }}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setFrameModalVisible(false);
                        router.push("/shop");
                      }}
                      style={{ flex: 1, borderColor: COLORS.primary }}
                      textColor={COLORS.primary}
                    >
                      Ir a tienda
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setFrameModalVisible(false);
                        router.navigate({
                          pathname: "/(tabs)/home",
                          params: { tab: "juegos" },
                        });
                      }}
                      style={{ flex: 1, borderColor: COLORS.primary }}
                      textColor={COLORS.primary}
                    >
                      Ir a juegos
                    </Button>
                  </View>
                )}
              </View>
            )}
          </Modal>

        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
