import { useState, useEffect } from "react";
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Button,
  Portal,
  Snackbar,
  Text,
  TextInput,
  IconButton,
  Dialog,
  Card,
} from "react-native-paper";
import { router } from "expo-router";
import Clipboard from '@react-native-clipboard/clipboard';
import {
  useGetFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  useGetFamilyGroupIdGroupMembers,
  useRemoveUserFromFamilyGroup,
  usePatchFamilyGroupIdGroup,
  useTransferFamilyGroupOwnership,
} from "@elepad/api-client";
import type { GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import { COLORS, STYLES } from "@/styles/base";
import { Pressable } from "react-native";

export default function FamilyGroup() {
  const { userElepad, refreshUserElepad } = useAuth();
  const [invitationCode, setInvitationCode] =
    useState<getFamilyGroupIdGroupInviteResponse>();

  const groupId = userElepad?.groupId;

  // Debug: Log user data when component mounts or userElepad changes
  useEffect(() => {
    console.log("FamilyGroup - userElepad:", userElepad);
    console.log("FamilyGroup - groupId:", groupId);
    
    // If we don't have a groupId but we have a user, try refreshing
    if (userElepad && !groupId) {
      console.log("FamilyGroup - No groupId found, refreshing user data...");
      refreshUserElepad();
    }
  }, [userElepad, groupId, refreshUserElepad]);

  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [advancedOptionsExpanded, setAdvancedOptionsExpanded] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");

  const patchFamilyGroup = usePatchFamilyGroupIdGroup(); // Este hook ya maneja la mutación

  // Hook para crear código de invitación
  const inviteQuery = useGetFamilyGroupIdGroupInvite(groupId ?? "", {
    query: { enabled: false }, // No ejecutar automáticamente
  });

  // Confirmación de eliminación
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null>(null);

  // Transferir ownership
  const [transferDialogVisible, setTransferDialogVisible] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null>(null);
  const [confirmTransferVisible, setConfirmTransferVisible] = useState(false);

  // Fetch group members via the generated React Query hook
  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId ?? "");
  const removeMember = useRemoveUserFromFamilyGroup();
  const transferOwnership = useTransferFamilyGroupOwnership();

  // Normaliza la respuesta del hook (envuelta en {data} o directa)
  const selectGroupInfo = (): GetFamilyGroupIdGroupMembers200 | undefined => {
    const resp = membersQuery.data as
      | { data?: GetFamilyGroupIdGroupMembers200 }
      | GetFamilyGroupIdGroupMembers200
      | undefined;
    if (!resp) return undefined;
    return (
      (resp as { data?: GetFamilyGroupIdGroupMembers200 }).data ??
      (resp as GetFamilyGroupIdGroupMembers200)
    );
  };

  // Variable para determinar si el usuario actual es el owner del grupo
  const groupInfo = selectGroupInfo();
  const isOwnerOfGroup = groupInfo?.owner?.id === userElepad?.id;

  const getInitials = (name: string) =>
    (name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const createInvitationCode = async () => {
    try {
      const result = await inviteQuery.refetch();
      if (result.data) {
        setInvitationCode(result.data);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Error al generar el enlace de invitación";
      Alert.alert("Error", msg);
    }
  };

  const copyInvitationCode = async () => {
    if (invitationCode) {
      Clipboard.setString(String(invitationCode));
      Alert.alert("¡Copiado!", "El código se ha copiado al portapapeles");
    }
  };

  const openAvatarModal = (avatarUrl: string, memberName: string) => {
    setSelectedAvatarUrl(avatarUrl);
    setSelectedMemberName(memberName);
    setAvatarModalVisible(true);
  };

  const closeAvatarModal = () => {
    setAvatarModalVisible(false);
    setSelectedAvatarUrl(null);
    setSelectedMemberName("");
  };

  const openConfirm = (member: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  }) => {
    setMemberToRemove(member);
    setConfirmVisible(true);
  };
  const closeConfirm = () => {
    setConfirmVisible(false);
    setMemberToRemove(null);
  };
  const confirmRemove = async () => {
    try {
      if (!groupId || !memberToRemove?.id) {
        Alert.alert("Error", "Faltan datos del grupo o del miembro");
        return;
      }

      const isSelfRemoval = memberToRemove.id === userElepad?.id;

      await removeMember.mutateAsync({
        idGroup: groupId,
        idUser: memberToRemove.id,
      });

      // Si el usuario se está saliendo del grupo, necesitamos refrescar su información
      if (isSelfRemoval) {
        await refreshUserElepad();
        // Pequeña pausa para asegurar que el backend haya procesado todo
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await membersQuery.refetch();

      const message = isSelfRemoval
        ? "Has salido del grupo correctamente. Se ha creado un nuevo grupo familiar para ti."
        : "El miembro fue eliminado correctamente.";

      Alert.alert(
        isSelfRemoval ? "Saliste del grupo" : "Miembro eliminado",
        message,
      );
    } catch (e: unknown) {
      type MaybeApiError = {
        data?: { error?: { message?: string } };
        message?: string;
      };
      const err = e as MaybeApiError;
      const msg =
        err?.data?.error?.message ??
        err?.message ??
        "Error eliminando al miembro";
      Alert.alert("Error", msg);
    } finally {
      closeConfirm();
    }
  };

  // Funciones para transferir ownership
  const openTransferDialog = () => {
    setTransferDialogVisible(true);
  };

  const closeTransferDialog = () => {
    setTransferDialogVisible(false);
    setSelectedNewOwner(null);
  };

  const selectNewOwner = (member: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  }) => {
    setSelectedNewOwner(member);
    setTransferDialogVisible(false);
    setConfirmTransferVisible(true);
  };

  const closeConfirmTransfer = () => {
    setConfirmTransferVisible(false);
    setSelectedNewOwner(null);
  };

  const confirmTransferOwnership = async () => {
    try {
      if (!groupId || !selectedNewOwner?.id) {
        Alert.alert("Error", "Faltan datos del grupo o del nuevo owner");
        return;
      }

      await transferOwnership.mutateAsync({
        idGroup: groupId,
        data: { newOwnerId: selectedNewOwner.id },
      });

      await membersQuery.refetch();

      Alert.alert(
        "Transferencia exitosa",
        `${selectedNewOwner.displayName} es ahora el nuevo administrador del grupo.`,
      );
    } catch (e: unknown) {
      type MaybeApiError = {
        data?: { error?: { message?: string } };
        message?: string;
      };
      const err = e as MaybeApiError;
      const msg =
        err?.data?.error?.message ??
        err?.message ??
        "Error transfiriendo la administración";
      Alert.alert("Error", msg);
    } finally {
      closeConfirmTransfer();
    }
  };

  return (
    <SafeAreaView style={STYLES.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {(() => {
            const groupInfo = selectGroupInfo();
            const groupName = groupInfo?.name;
            if (!groupName) return null;

            return (
              <>
                <Card style={[STYLES.titleCard]}>
                  <Card.Content>
                    <Text style={STYLES.subheading}>Grupo Familiar</Text>
                    {isEditing ? (
                      <>
                        <TextInput
                          style={[STYLES.input]}
                          value={newGroupName}
                          underlineColor="transparent"
                          activeUnderlineColor={COLORS.primary}
                          onChangeText={setNewGroupName}
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
                            mode="contained"
                            onPress={() => setIsEditing(false)}
                            disabled={patchFamilyGroup.isPending}
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
                              if (!newGroupName.trim() || !groupId) return;
                              if (newGroupName === groupName) {
                                setIsEditing(false);
                                return;
                              }
                              try {
                                await patchFamilyGroup.mutateAsync({
                                  idGroup: groupId,
                                  data: { name: newGroupName },
                                });
                                setIsEditing(false);
                                setSnackbarMessage(
                                  "Nombre del grupo familiar actualizado correctamente",
                                );
                                setSnackbarError(false);
                                setSnackbarVisible(true);
                                // Refrescar los datos manualmente
                                if (membersQuery.refetch) {
                                  await membersQuery.refetch();
                                }
                              } catch (e: unknown) {
                                const msg =
                                  e instanceof Error
                                    ? e.message
                                    : "Error al actualizar el nombre del grupo";
                                setSnackbarMessage(msg);
                                setSnackbarError(true);
                                setSnackbarVisible(true);
                              }
                            }}
                            loading={patchFamilyGroup.isPending}
                            style={[STYLES.buttonPrimary, { width: "40%" }]}
                            disabled={
                              !newGroupName.trim() || patchFamilyGroup.isPending
                            }
                          >
                            Guardar
                          </Button>
                        </View>
                      </>
                    ) : (
                      <View
                        style={{
                          position: "relative",
                          width: "100%",
                          alignItems: "center",
                        }}
                      >
                        <Text style={[STYLES.heading]}>{groupName}</Text>
                        <Pressable
                          onPress={() => {
                            setNewGroupName(groupName || "");
                            setIsEditing(true);
                          }}
                        >
                          <IconButton
                            icon="pencil"
                            iconColor={COLORS.textLight}
                            style={{ margin: 0 }}
                          />
                        </Pressable>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </>
            );
          })()}
          {/* Mostramos los miembros del grupo Familiar */}
          <Card style={[STYLES.titleCard, { marginBottom: 6 }]}>
            <Card.Content>
              <Text style={[STYLES.heading, { fontSize: 16, marginBottom: 8 }]}>
                Miembros
              </Text>

              {membersQuery.isLoading ? (
                <ActivityIndicator
                  style={{ marginVertical: 20, alignSelf: "center" }}
                />
              ) : membersQuery.error ? (
                <Text
                  style={[
                    STYLES.subheading,
                    { color: COLORS.error, textAlign: "center" },
                  ]}
                >
                  Error cargando miembros
                </Text>
              ) : (
                <View style={{ width: "100%" }}>
                  {/* Mostrar el owner */}
                  {(() => {
                    if (!groupInfo) return null;
                    const o = groupInfo.owner;

                    return (
                      <View
                        style={[
                          STYLES.memberInfoRow,
                          {
                            justifyContent: "space-between",
                            paddingTop: 4,
                            paddingBottom: 4,
                          },
                        ]}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {o.avatarUrl ? (
                            <Pressable onPress={() => openAvatarModal(o.avatarUrl!, o.displayName)}>
                              <Image
                                source={{ uri: o.avatarUrl }}
                                style={{
                                  width: 47,
                                  height: 47,
                                  borderRadius: 40,
                                }}
                              />
                            </Pressable>
                          ) : (
                            <View style={STYLES.memberAvatarPlaceholder}>
                              <Text style={STYLES.memberInitials}>
                                {getInitials(o.displayName)}
                              </Text>
                            </View>
                          )}
                          <View style={{ marginLeft: 12 }}>
                            <Text style={STYLES.paragraphText}>
                              {o.displayName}
                            </Text>
                            <Text
                              style={[
                                STYLES.subheading,
                                { textAlign: "left", marginTop: 0 },
                              ]}
                            >
                              Dueño
                            </Text>
                          </View>
                        </View>
                        {/* Solo mostrar basurero si el owner actual está viendo a otro owner (caso edge) */}
                        {isOwnerOfGroup && o.id !== userElepad?.id && (
                          <IconButton
                            icon="delete"
                            size={20}
                            iconColor={COLORS.error}
                            onPress={() => openConfirm(o)}
                            accessibilityLabel={`Eliminar a ${o.displayName}`}
                          />
                        )}
                      </View>
                    );
                  })()}

                  {/* Mostrar los miembros */}
                  {(() => {
                    const membersArray = groupInfo?.members;

                    if (!membersArray || membersArray.length === 0) {
                      return null;
                    }

                    return membersArray.map((m) => (
                      <View
                        key={m.id}
                        style={[
                          STYLES.memberInfoRow,
                          {
                            justifyContent: "space-between",
                            paddingTop: 4,
                            paddingBottom: 4,
                          },
                        ]}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {m.avatarUrl ? (
                            <Pressable onPress={() => openAvatarModal(m.avatarUrl!, m.displayName)}>
                              <Image
                                source={{ uri: m.avatarUrl }}
                                style={{
                                  width: 47,
                                  height: 47,
                                  borderRadius: 40,
                                }}
                              />
                            </Pressable>
                          ) : (
                            <View style={STYLES.memberAvatarPlaceholder}>
                              <Text style={STYLES.memberInitials}>
                                {getInitials(m.displayName)}
                              </Text>
                            </View>
                          )}
                          <View style={{ marginLeft: 12 }}>
                            <Text style={STYLES.paragraphText}>
                              {m.displayName}
                            </Text>
                          </View>
                        </View>

                        {/* Solo mostrar la opción de eliminar si el usuario actual es owner */}
                        {isOwnerOfGroup && (
                          <IconButton
                            icon="delete"
                            size={22}
                            iconColor={COLORS.error}
                            onPress={() => openConfirm(m)}
                            accessibilityLabel={`Eliminar a ${m.displayName}`}
                            style={{ alignSelf: "center" }}
                          />
                        )}
                      </View>
                    ));
                  })()}

                  {/* Opciones avanzadas */}
                  <View
                    style={{
                      width: "100%",
                      marginTop: 16,
                      alignItems: "center",
                    }}
                  >
                    {/* Línea divisoria centrada */}
                    <View
                      style={{
                        width: "95%",
                        borderTopWidth: 0.5,
                        borderTopColor: COLORS.textLight,
                      }}
                    />

                    {/* Contenedor de opciones avanzadas */}
                    <View style={{ width: "100%" }}>
                      <Pressable
                        onPress={() =>
                          setAdvancedOptionsExpanded(!advancedOptionsExpanded)
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 10,
                        }}
                      >
                        <Text
                          style={[
                            STYLES.subheading,
                            {
                              color: COLORS.textLight,
                              fontSize: 14,
                              textAlign: "left",
                              marginLeft: 10,
                              marginTop: 0,
                            },
                          ]}
                        >
                          Opciones avanzadas
                        </Text>
                        <IconButton
                          icon={
                            advancedOptionsExpanded
                              ? "chevron-down"
                              : "chevron-right"
                          }
                          size={20}
                          iconColor={COLORS.textLight}
                          style={{ margin: 0 }}
                        />
                      </Pressable>

                      {/* Contenido expandible */}
                      {advancedOptionsExpanded && (
                        <View style={{ paddingTop: 0 }}>
                          {/* Opción de crear enlace de invitación */}
                          <Pressable
                            onPress={createInvitationCode}
                            disabled={inviteQuery.isFetching}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 10,
                              paddingHorizontal: 8,
                              backgroundColor: inviteQuery.isFetching
                                ? COLORS.backgroundSecondary
                                : "transparent",
                              borderRadius: 8,
                            }}
                          >
                            <IconButton
                              icon="account-multiple-plus"
                              size={20}
                              iconColor={COLORS.primary}
                              style={{ margin: 0, marginRight: 8 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  STYLES.paragraphText,
                                  { color: COLORS.text },
                                ]}
                              >
                                Crear enlace de invitación
                              </Text>
                              <Text
                                style={[
                                  STYLES.subheading,
                                  {
                                    fontSize: 12,
                                    textAlign: "left",
                                    marginTop: 2,
                                    color: COLORS.textLight,
                                  },
                                ]}
                              >
                                Invita nuevos miembros al grupo
                              </Text>
                            </View>
                            {inviteQuery.isFetching && (
                              <ActivityIndicator
                                size="small"
                                color={COLORS.primary}
                              />
                            )}
                          </Pressable>

                          {/* Opción de transferir administración (solo para owner con miembros) */}
                          {(() => {
                            const hasMembers =
                              groupInfo?.members &&
                              groupInfo.members.length > 0;
                            if (!isOwnerOfGroup || !hasMembers) return null;

                            return (
                              <Pressable
                                onPress={() => {
                                  const groupInfo = selectGroupInfo();
                                  const membersArray = groupInfo?.members;

                                  if (
                                    !membersArray ||
                                    membersArray.length === 0
                                  ) {
                                    Alert.alert(
                                      "Sin miembros",
                                      "No hay otros miembros en el grupo para transferir la administración.",
                                    );
                                    return;
                                  }

                                  openTransferDialog();
                                }}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  paddingVertical: 8,
                                  paddingHorizontal: 8,
                                  borderRadius: 8,
                                }}
                              >
                                <IconButton
                                  icon="account-switch"
                                  size={20}
                                  iconColor={COLORS.primary}
                                  style={{ margin: 0, marginRight: 8 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      STYLES.paragraphText,
                                      { color: COLORS.text },
                                    ]}
                                  >
                                    Transferir administración
                                  </Text>
                                  <Text
                                    style={[
                                      STYLES.subheading,
                                      {
                                        fontSize: 12,
                                        textAlign: "left",
                                        marginTop: 2,
                                        color: COLORS.textLight,
                                      },
                                    ]}
                                  >
                                    Cambiar el administrador del grupo
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })()}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Solo botón de salir del grupo */}
          <View style={[{ alignItems: "center", width: "100%", marginTop: 0 }]}>
            <Button
              mode="contained"
              icon="exit-to-app"
              onPress={() => {
                if (isOwnerOfGroup) {
                  Alert.alert(
                    "No puedes salir del grupo",
                    "Como administrador del grupo, primero debes transferir la administración a otro miembro antes de poder salir.",
                    [{ text: "Entendido", style: "default" }],
                  );
                  return;
                }

                // Si no es owner, proceder con la auto-eliminación
                if (userElepad?.id) {
                  openConfirm({
                    id: userElepad.id,
                    displayName: userElepad.displayName,
                    avatarUrl: userElepad.avatarUrl || null,
                  });
                }
              }}
              contentStyle={STYLES.buttonContent}
              style={[
                STYLES.buttonPrimary,
                { backgroundColor: COLORS.secondary },
              ]}
            >
              Salir del grupo familiar
            </Button>

            {/* Link para volver, sin botón */}
            <Text
              onPress={() => router.push("/(tabs)/configuracion")}
              style={[STYLES.subheading, { marginTop: 23 }]}
            >
              Volver
            </Text>
          </View>

          {invitationCode && (
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeLabel}>Código de invitación</Text>
              <View style={styles.codeCard}>
                <Text style={styles.codeText}>
                  {String(invitationCode)}
                </Text>
                <IconButton
                  icon="content-copy"
                  size={20}
                  iconColor={COLORS.primary}
                  onPress={copyInvitationCode}
                  style={styles.copyButton}
                />
              </View>
              <Text style={styles.expiryText}>
                Expira 10 minutos luego de su creación.
              </Text>
            </View>
          )}
        </View>
        <Portal>
          <Dialog
            visible={confirmVisible}
            onDismiss={closeConfirm}
            style={{
              alignSelf: "center",
              width: "90%",
              backgroundColor: COLORS.background,
            }}
          >
            <Dialog.Title>
              <Text style={[STYLES.heading, { fontSize: 18, paddingTop: 15 }]}>
                {memberToRemove?.id === userElepad?.id
                  ? "Salir del grupo"
                  : "Eliminar miembro"}
              </Text>
            </Dialog.Title>
            <Dialog.Content>
              <Text style={[STYLES.subheading]}>
                {memberToRemove?.id === userElepad?.id ? (
                  <>¿Está seguro que desea salir del grupo familiar?</>
                ) : (
                  <>
                    ¿Está seguro que desea eliminar a {""}
                    <Text style={[STYLES.paragraphText, { fontWeight: "700" }]}>
                      {memberToRemove?.displayName}
                    </Text>{" "}
                    del grupo?
                  </>
                )}
              </Text>
            </Dialog.Content>
            <Dialog.Actions
              style={{
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            >
              <Button
                mode="contained"
                onPress={closeConfirm}
                style={[
                  STYLES.buttonPrimary,
                  { width: "40%", marginTop: 0, backgroundColor: COLORS.white },
                ]}
                labelStyle={{ color: COLORS.text }}
                contentStyle={STYLES.buttonContent}
              >
                No
              </Button>
              <Button
                mode="contained"
                onPress={confirmRemove}
                style={[
                  STYLES.buttonPrimary,
                  {
                    width: "40%",
                    backgroundColor: COLORS.secondary,
                    marginTop: 0,
                    opacity: removeMember.isPending ? 0.7 : 1,
                  },
                ]}
                labelStyle={{
                  color: COLORS.white,
                  fontFamily: "Montserrat_500Medium",
                }}
                contentStyle={STYLES.buttonContent}
                disabled={removeMember.isPending}
              >
                {memberToRemove?.id === userElepad?.id ? "Salir" : "Si"}
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Diálogo para seleccionar nuevo owner */}
          <Dialog
            visible={transferDialogVisible}
            onDismiss={closeTransferDialog}
            style={{
              alignSelf: "center",
              width: "90%",
              backgroundColor: COLORS.background,
            }}
          >
            <Dialog.Title>
              <Text style={[STYLES.heading, { fontSize: 18, paddingTop: 15 }]}>
                Transferir administración
              </Text>
            </Dialog.Title>
            <Dialog.Content>
              <Text style={[STYLES.subheading]}>
                Selecciona el miembro que será el nuevo administrador del grupo:
              </Text>
              <ScrollView style={{ maxHeight: 300, marginTop: 16 }}>
                {(() => {
                  const groupInfo = selectGroupInfo();
                  const membersArray = groupInfo?.members;

                  if (!membersArray || membersArray.length === 0) {
                    return (
                      <Text
                        style={[
                          STYLES.subheading,
                          { color: COLORS.textSecondary, fontStyle: "italic" },
                        ]}
                      >
                        No hay miembros disponibles
                      </Text>
                    );
                  }

                  return membersArray.map((member) => (
                    <Pressable
                      key={member.id}
                      onPress={() => selectNewOwner(member)}
                      style={[
                        STYLES.card,
                        {
                          paddingVertical: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 0,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        {member.avatarUrl ? (
                          <Pressable onPress={() => openAvatarModal(member.avatarUrl!, member.displayName)}>
                            <Image
                              source={{ uri: member.avatarUrl }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                marginRight: 12,
                              }}
                            />
                          </Pressable>
                        ) : (
                          <View style={STYLES.memberAvatarPlaceholder}>
                            <Text style={STYLES.memberInitials}>
                              {getInitials(member.displayName)}
                            </Text>
                          </View>
                        )}
                        <Text style={[STYLES.paragraphText]}>
                          {member.displayName}
                        </Text>
                      </View>
                    </Pressable>
                  ));
                })()}
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions
              style={{
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            >
              <Button
                mode="contained"
                onPress={closeTransferDialog}
                style={[
                  STYLES.buttonPrimary,
                  { marginTop: 0, backgroundColor: COLORS.white },
                ]}
                labelStyle={{ color: COLORS.text }}
                contentStyle={STYLES.buttonContent}
              >
                Cancelar
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Diálogo de confirmación de transferencia */}
          <Dialog
            visible={confirmTransferVisible}
            onDismiss={closeConfirmTransfer}
            style={{
              alignSelf: "center",
              width: "90%",
              backgroundColor: COLORS.background,
            }}
          >
            <Dialog.Title>
              <Text style={[STYLES.heading, { fontSize: 18, paddingTop: 15 }]}>
                Confirmar transferencia
              </Text>
            </Dialog.Title>
            <Dialog.Content>
              <Text style={[STYLES.subheading]}>
                ¿Está seguro que desea transferir la administración del grupo a{" "}
                <Text style={[STYLES.paragraphText, { fontWeight: "700" }]}>
                  {selectedNewOwner?.displayName}
                </Text>
                ?
              </Text>
              <Text
                style={[
                  STYLES.subheading,
                  {
                    marginTop: 12,
                    fontStyle: "italic",
                    color: COLORS.secondary,
                    fontSize: 14,
                  },
                ]}
              >
                ⚠️ Una vez realizada la transferencia, usted dejará de ser el
                administrador y no podrá deshacer esta operación.
              </Text>
            </Dialog.Content>
            <Dialog.Actions
              style={{
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            >
              <Button
                mode="contained"
                onPress={closeConfirmTransfer}
                style={[
                  STYLES.buttonPrimary,
                  { width: "40%", marginTop: 0, backgroundColor: COLORS.white },
                ]}
                labelStyle={{ color: COLORS.text }}
                contentStyle={STYLES.buttonContent}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={confirmTransferOwnership}
                style={[
                  STYLES.buttonPrimary,
                  {
                    width: "40%",
                    backgroundColor: COLORS.secondary,
                    marginTop: 0,
                    opacity: transferOwnership.isPending ? 0.7 : 1,
                  },
                ]}
                labelStyle={{
                  color: COLORS.white,
                  fontFamily: "Montserrat_500Medium",
                }}
                contentStyle={STYLES.buttonContent}
                disabled={transferOwnership.isPending}
                loading={transferOwnership.isPending}
              >
                Transferir
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Avatar Modal */}
          <Dialog
            visible={avatarModalVisible}
            onDismiss={closeAvatarModal}
            style={{
              alignSelf: "center",
              width: "90%",
              backgroundColor: COLORS.background,
            }}
          >
            <Dialog.Title>
              <Text style={[STYLES.heading, { fontSize: 18, paddingTop: 15, textAlign: "center" }]}>
                {selectedMemberName}
              </Text>
            </Dialog.Title>
            <Dialog.Content>
              <View style={styles.avatarModalContent}>
                {selectedAvatarUrl && (
                  <Image
                    source={{ uri: selectedAvatarUrl }}
                    style={styles.avatarModalImage}
                  />
                )}
              </View>
            </Dialog.Content>
            <Dialog.Actions style={{ justifyContent: "center" }}>
              <Button
                mode="outlined"
                onPress={closeAvatarModal}
                style={styles.avatarModalButton}
              >
                Cerrar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  inviteCodeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  codeCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  avatarModalContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarModalImage: {
    width: 210,
    height: 210,
    borderRadius: 110,
    backgroundColor: COLORS.backgroundSecondary,
  },
  avatarModalButton: {
    borderColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 100,
  },
};
