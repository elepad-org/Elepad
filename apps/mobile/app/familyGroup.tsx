import React, { useState } from "react";
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
} from "react-native-paper";
import { Link } from "expo-router";
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
import { COLORS, styles as baseStyles } from "@/styles/base";
import { Pressable } from "react-native";

export default function FamilyGroup() {
  const { userElepad, refreshUserElepad } = useAuth();
  const [invitationCode, setInvitationCode] =
    useState<getFamilyGroupIdGroupInviteResponse>();

  const groupId = userElepad?.groupId;

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

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
        setSnackbarMessage(
          `Enlace de invitación generado correctamente: http://elepad.com/invite/${result.data}`,
        );
        setSnackbarError(false);
        setSnackbarVisible(true);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Error al generar el enlace de invitación";
      setSnackbarMessage(msg);
      setSnackbarError(true);
      setSnackbarVisible(true);
    }
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
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        contentContainerStyle={baseStyles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={baseStyles.footer}>
          {(() => {
            const groupInfo = selectGroupInfo();
            const groupName = groupInfo?.name;
            if (!groupName) return null;

            return (
              <View style={baseStyles.card}>
                {isEditing ? (
                  <View style={baseStyles.center}>
                    <TextInput
                      style={[baseStyles.input, { marginTop: 8 }]}
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      autoFocus
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 16,
                        width: "100%",
                        gap: 12,
                      }}
                    >
                      <Button
                        mode="text"
                        onPress={() => setIsEditing(false)}
                        disabled={patchFamilyGroup.isPending}
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
                              "Nombre del Grupo Familiar actualizado correctamente",
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
                        disabled={
                          !newGroupName.trim() || patchFamilyGroup.isPending
                        }
                      >
                        Guardar
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setNewGroupName(groupName || "");
                      setIsEditing(true);
                    }}
                    style={{
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={[
                        baseStyles.subheading,
                        { marginTop: 0, marginBottom: 8, textAlign: "center" },
                      ]}
                    >
                      Grupo Familiar
                    </Text>
                    <Text
                      style={[
                        baseStyles.heading,
                        {
                          fontSize: 20,
                          marginTop: 0,
                          marginBottom: 8,
                          textAlign: "center",
                        },
                      ]}
                    >
                      {groupName}
                    </Text>
                    <IconButton
                      icon="pencil"
                      size={18}
                      iconColor="#64748b"
                      style={{ marginLeft: 8 }}
                    />
                  </Pressable>
                )}
              </View>
            );
          })()}
          {/* Mostramos los miembros del grupo Familiar */}
          <View style={{ marginTop: 24 }}>
            {/* Antes de los miembros debemos mostrar centrado y lindo el nombre del grupo */}

            <Text
              style={[
                baseStyles.heading,
                { marginBottom: 16, textAlign: "center" },
              ]}
            >
              Miembros del grupo
            </Text>
            {(() => {
              if (!groupInfo) return null;
              const o = groupInfo.owner;

              return (
                <View
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: COLORS.white,
                      borderRadius: 8,
                      marginBottom: 8,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {o.avatarUrl ? (
                      <Image
                        source={{ uri: o.avatarUrl }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                      />
                    ) : (
                      <View style={baseStyles.memberAvatarPlaceholder}>
                        <Text style={baseStyles.memberInitials}>
                          {getInitials(o.displayName)}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text
                        style={[
                          baseStyles.heading,
                          { fontSize: 16, marginTop: 0, marginLeft: 12 },
                        ]}
                      >
                        {o.displayName}
                      </Text>
                      <Text
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          marginLeft: 12,
                        }}
                      >
                        Owner
                      </Text>
                    </View>
                  </View>
                  {/* Solo mostrar basurero si el owner actual está viendo a otro owner (caso edge) */}
                  {isOwnerOfGroup && o.id !== userElepad?.id && (
                    <IconButton
                      icon="delete"
                      size={22}
                      iconColor="#d32f2f"
                      onPress={() => openConfirm(o)}
                      accessibilityLabel={`Eliminar a ${o.displayName}`}
                    />
                  )}
                </View>
              );
            })()}
            {membersQuery.isLoading ? (
              <ActivityIndicator
                style={{ marginVertical: 20, alignSelf: "center" }}
              />
            ) : membersQuery.error ? (
              <Text
                style={[
                  baseStyles.subheading,
                  { color: COLORS.error, textAlign: "center" },
                ]}
              >
                Error cargando miembros
              </Text>
            ) : (
              (() => {
                const membersArray = groupInfo?.members;

                if (!membersArray || membersArray.length === 0) {
                  return null;
                }

                return membersArray.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: COLORS.white,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {m.avatarUrl ? (
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                        />
                      ) : (
                        <View style={baseStyles.memberAvatarPlaceholder}>
                          <Text style={baseStyles.memberInitials}>
                            {getInitials(m.displayName)}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[
                          baseStyles.heading,
                          { fontSize: 16, marginTop: 0, marginLeft: 12 },
                        ]}
                      >
                        {m.displayName}
                      </Text>
                    </View>

                    {/* Solo mostrar la opción de eliminar si el usuario actual es owner */}
                    {isOwnerOfGroup && (
                      <IconButton
                        icon="delete"
                        size={22}
                        iconColor="#d32f2f"
                        onPress={() => openConfirm(m)}
                        accessibilityLabel={`Eliminar a ${m.displayName}`}
                      />
                    )}
                  </View>
                ));
              })()
            )}
          </View>

          {/* Botón para salir del grupo familiar */}
          <Button
            mode="outlined"
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
            contentStyle={baseStyles.buttonContent}
            style={[baseStyles.buttonSecondary, { marginBottom: 12 }]}
            buttonColor="#fff"
            textColor="#d32f2f"
          >
            Salir del grupo familiar
          </Button>

          {/* Botón de transferir ownership (solo para el owner) */}
          {(() => {
            const hasMembers =
              groupInfo?.members && groupInfo.members.length > 0;

            if (!isOwnerOfGroup || !hasMembers) return null;

            return (
              <Button
                mode="outlined"
                icon="account-switch"
                onPress={openTransferDialog}
                contentStyle={baseStyles.buttonContent}
                style={[baseStyles.buttonSecondary, { marginBottom: 12 }]}
                textColor={COLORS.primary}
              >
                Transferir administración
              </Button>
            );
          })()}

          <Button
            mode="contained"
            icon="account-multiple-plus"
            onPress={() => {
              createInvitationCode();
            }}
            contentStyle={baseStyles.buttonContent}
            style={baseStyles.buttonPrimary}
            loading={inviteQuery.isFetching}
            disabled={inviteQuery.isFetching}
          >
            Crear enlace de invitación
          </Button>

          {invitationCode && (
            <View style={baseStyles.card}>
              <Text
                style={[
                  baseStyles.heading,
                  { fontSize: 16, color: COLORS.white, textAlign: "center" },
                ]}
              >
                Código de invitación
              </Text>
              <Text
                style={[
                  baseStyles.subheading,
                  { color: COLORS.white, fontSize: 14, marginTop: 8 },
                ]}
              >
                {String(invitationCode)}
              </Text>
              <Text
                style={[
                  baseStyles.subheading,
                  {
                    color: COLORS.white,
                    fontSize: 12,
                    marginTop: 8,
                    opacity: 0.8,
                  },
                ]}
              >
                Expira 10 minutos luego de su creación.
              </Text>
            </View>
          )}
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Link
              href={{ pathname: "/perfil" }}
              accessibilityRole="button"
              style={[
                baseStyles.buttonSecondary,
                {
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  textAlign: "center",
                },
              ]}
            >
              Volver
            </Link>
          </View>
        </View>
        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
            style={{
              backgroundColor: snackbarError ? COLORS.error : COLORS.success,
              borderRadius: 8,
            }}
          >
            {snackbarMessage}
          </Snackbar>

          <Dialog visible={confirmVisible} onDismiss={closeConfirm}>
            <Dialog.Title>
              {memberToRemove?.id === userElepad?.id
                ? "Salir del grupo"
                : "Eliminar miembro"}
            </Dialog.Title>
            <Dialog.Content>
              <Text>
                {memberToRemove?.id === userElepad?.id ? (
                  <>¿Está seguro que desea salir del grupo familiar?</>
                ) : (
                  <>
                    ¿Está seguro que desea eliminar a {""}
                    <Text style={{ fontWeight: "700" }}>
                      {memberToRemove?.displayName}
                    </Text>{" "}
                    del grupo?
                  </>
                )}
              </Text>
            </Dialog.Content>
            <Dialog.Actions style={{ justifyContent: "space-between" }}>
              <Button onPress={closeConfirm}>NO</Button>
              <Button
                onPress={confirmRemove}
                textColor="#ffffff"
                mode="contained"
                style={{
                  backgroundColor: "#d32f2f",
                  opacity: removeMember.isPending ? 0.7 : 1,
                }}
                disabled={removeMember.isPending}
              >
                {memberToRemove?.id === userElepad?.id ? "SALIR" : "SI"}
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Diálogo para seleccionar nuevo owner */}
          <Dialog
            visible={transferDialogVisible}
            onDismiss={closeTransferDialog}
          >
            <Dialog.Title>Transferir administración</Dialog.Title>
            <Dialog.Content>
              <Text style={{ marginBottom: 16 }}>
                Selecciona el miembro que será el nuevo administrador del grupo:
              </Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {(() => {
                  const groupInfo = selectGroupInfo();
                  const membersArray = groupInfo?.members;

                  if (!membersArray || membersArray.length === 0) {
                    return (
                      <Text
                        style={[
                          baseStyles.subheading,
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
                        baseStyles.card,
                        {
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                          paddingVertical: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
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
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 25,
                              marginRight: 12,
                            }}
                          />
                        ) : (
                          <View style={baseStyles.memberAvatarPlaceholder}>
                            <Text style={baseStyles.memberInitials}>
                              {getInitials(member.displayName)}
                            </Text>
                          </View>
                        )}
                        <Text style={baseStyles.heading}>
                          {member.displayName}
                        </Text>
                      </View>
                    </Pressable>
                  ));
                })()}
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeTransferDialog}>Cancelar</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Diálogo de confirmación de transferencia */}
          <Dialog
            visible={confirmTransferVisible}
            onDismiss={closeConfirmTransfer}
          >
            <Dialog.Title>Confirmar transferencia</Dialog.Title>
            <Dialog.Content>
              <Text>
                ¿Está seguro que desea transferir la administración del grupo a{" "}
                <Text style={{ fontWeight: "700" }}>
                  {selectedNewOwner?.displayName}
                </Text>
                ?
              </Text>
              <Text
                style={{
                  marginTop: 12,
                  fontStyle: "italic",
                  color: "#d32f2f",
                  fontSize: 14,
                }}
              >
                ⚠️ Una vez realizada la transferencia, usted dejará de ser el
                administrador y no podrá deshacer esta operación.
              </Text>
            </Dialog.Content>
            <Dialog.Actions style={{ justifyContent: "space-between" }}>
              <Button onPress={closeConfirmTransfer}>Cancelar</Button>
              <Button
                onPress={confirmTransferOwnership}
                textColor="#ffffff"
                mode="contained"
                style={{
                  backgroundColor: "#d32f2f",
                  opacity: transferOwnership.isPending ? 0.7 : 1,
                }}
                disabled={transferOwnership.isPending}
                loading={transferOwnership.isPending}
              >
                Transferir
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
