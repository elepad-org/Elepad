import React, { useState } from "react";
import {
  StyleSheet,
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
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  useGetFamilyGroupIdGroupMembers,
  useRemoveUserFromFamilyGroup,
  usePatchFamilyGroupIdGroup,
  useTransferFamilyGroupOwnership,
} from "@elepad/api-client";
import type { GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import { FONT } from "@/styles/theme";
import { COLORS, commonStyles } from "@/styles/shared";
import { Pressable } from "react-native";

// Using shared COLORS from shared.ts

export default function FamilyGroup() {
  const { userElepad } = useAuth();
  const [invitationCode, setInvitationCode] =
    useState<getFamilyGroupIdGroupInviteResponse>();

  const groupId = userElepad?.groupId;

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const patchFamilyGroup = usePatchFamilyGroupIdGroup(); // Este hook ya maneja la mutación

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

  const getInitials = (name: string) =>
    (name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const createInvitationCode = async () => {
    const link = await getFamilyGroupIdGroupInvite(groupId ?? "1");
    console.log(link);
    setInvitationCode(link);
    setSnackbarVisible(true);
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

      await removeMember.mutateAsync({
        idGroup: groupId,
        idUser: memberToRemove.id,
      });

      // Refrescar la lista de miembros
      await membersQuery.refetch();

      Alert.alert(
        "Miembro eliminado",
        "El miembro fue eliminado correctamente.",
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

      // Refrescar la lista de miembros para mostrar los nuevos datos
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.footer}>
          {/* Nombre del grupo (centrado y lindo) */}
          {(() => {
            const groupInfo = selectGroupInfo();
            const groupName = groupInfo?.name;
            if (!groupName) return null;
            return (
              <View style={styles.groupHeaderCard}>
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      autoFocus
                    />
                    <View style={styles.editButtons}>
                      <Button
                        mode="text"
                        onPress={() => setIsEditing(false)}
                        disabled={isUpdating}
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
                            setIsUpdating(true);
                            await patchFamilyGroup.mutateAsync({
                              idGroup: groupId,
                              data: { name: newGroupName },
                            });
                            setIsEditing(false);
                            setSnackbarVisible(true);
                            // Refrescar los datos manualmente
                            if (membersQuery.refetch) {
                              await membersQuery.refetch();
                            }
                          } catch (e: unknown) {
                            const msg =
                              e instanceof Error
                                ? e.message
                                : "Error al actualizar";
                            console.warn(msg);
                          } finally {
                            setIsUpdating(false);
                          }
                        }}
                        loading={isUpdating}
                        disabled={!newGroupName.trim()}
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
                    style={styles.nameContainer}
                  >
                    <Text style={styles.groupHeaderSubtitle}>
                      Grupo Familiar
                    </Text>
                    <View style={styles.nameRowContainer}>
                      <Text style={styles.groupHeaderTitle}>{groupName}</Text>
                      <IconButton
                        icon="pencil"
                        size={18}
                        iconColor="#64748b"
                        style={styles.editIcon}
                      />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })()}
          {/* Mostramos los miembros del grupo Familiar */}
          <View style={styles.membersSection}>
            {/* Antes de los miembros debemos mostrar centrado y lindo el nombre del grupo */}

            <Text style={styles.membersTitle}>Miembros del grupo</Text>
            {(() => {
              const groupInfo = selectGroupInfo();
              if (!groupInfo) return null;
              const o = groupInfo.owner;
              return (
                <View style={[styles.memberRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.memberInfo}>
                    {o.avatarUrl ? (
                      <Image
                        source={{ uri: o.avatarUrl }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberInitials}>
                          {getInitials(o.displayName)}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.memberName}>{o.displayName}</Text>
                      <Text style={{ color: "#64748b", fontSize: 12 }}>
                        Owner
                      </Text>
                    </View>
                  </View>
                  <IconButton
                    icon="delete"
                    size={22}
                    iconColor="#d32f2f"
                    onPress={() => openConfirm(o)}
                    accessibilityLabel={`Eliminar a ${o.displayName}`}
                  />
                </View>
              );
            })()}
            {membersQuery.isLoading ? (
              <ActivityIndicator style={styles.membersLoading} />
            ) : membersQuery.error ? (
              <Text style={styles.membersError}>Error cargando miembros</Text>
            ) : (
              (() => {
                const groupInfo = selectGroupInfo();
                const membersArray = groupInfo?.members;

                if (!membersArray || membersArray.length === 0) {
                  return (
                    <Text style={styles.noMembersText}>
                      No hay miembros para mostrar
                    </Text>
                  );
                }

                return membersArray.map((m) => (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={styles.memberInfo}>
                      {m.avatarUrl ? (
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <View style={styles.memberAvatarPlaceholder}>
                          <Text style={styles.memberInitials}>
                            {getInitials(m.displayName)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.memberName}>{m.displayName}</Text>
                    </View>

                    <IconButton
                      icon="delete"
                      size={22}
                      iconColor="#d32f2f"
                      onPress={() => openConfirm(m)}
                      accessibilityLabel={`Eliminar a ${m.displayName}`}
                    />
                  </View>
                ));
              })()
            )}
          </View>

          {/* Botón de transferir ownership (solo para el owner) */}
          {(() => {
            const groupInfo = selectGroupInfo();
            const isOwner = groupInfo?.owner?.id === userElepad?.id;
            const hasMembers =
              groupInfo?.members && groupInfo.members.length > 0;

            if (!isOwner || !hasMembers) return null;

            return (
              <Button
                mode="outlined"
                icon="account-switch"
                onPress={openTransferDialog}
                contentStyle={styles.bottomButtonContent}
                style={[styles.bottomButton, { marginBottom: 12 }]}
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
            contentStyle={styles.bottomButtonContent}
            style={styles.bottomButton}
          >
            Crear enlace de invitación
          </Button>

          {invitationCode && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Código de invitación</Text>
              <Text style={styles.cardContent}>{String(invitationCode)}</Text>
              <Text style={styles.cardInfo}>
                Expira 10 minutos luego de su creación.
              </Text>
            </View>
          )}
          <Link
            href={{ pathname: "/perfil" }}
            accessibilityRole="button"
            style={styles.inlineBack}
          >
            Volver
          </Link>
        </View>
        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
            style={styles.successSnackbar}
          >
            {`Enlace de invitación generado correctamente: http://elepad.com/invite/${invitationCode} `}
          </Snackbar>

          <Dialog visible={confirmVisible} onDismiss={closeConfirm}>
            <Dialog.Title>Eliminar miembro</Dialog.Title>
            <Dialog.Content>
              <Text>
                ¿Está seguro que desea eliminar a {""}
                <Text style={{ fontWeight: "700" }}>
                  {memberToRemove?.displayName}
                </Text>{" "}
                del grupo?
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
                SI
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
                      <Text style={styles.noMembersText}>
                        No hay miembros disponibles
                      </Text>
                    );
                  }

                  return membersArray.map((member) => (
                    <Pressable
                      key={member.id}
                      onPress={() => selectNewOwner(member)}
                      style={[
                        styles.memberRow,
                        {
                          borderBottomWidth: 1,
                          borderBottomColor: "#e0e0e0",
                          paddingVertical: 12,
                        },
                      ]}
                    >
                      <View style={styles.memberInfo}>
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={styles.memberAvatar}
                          />
                        ) : (
                          <View style={styles.memberAvatarPlaceholder}>
                            <Text style={styles.memberInitials}>
                              {getInitials(member.displayName)}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.memberName}>
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

const styles = StyleSheet.create({
  // Using common styles from shared.ts
  ...commonStyles,

  // Styles specific to this component or overrides
  safeArea: {
    ...commonStyles.safeArea,
    backgroundColor: COLORS.background,
  },

  membersLoading: {
    marginVertical: 8,
  },
  membersError: {
    color: "red",
  },
  noMembersText: {
    color: COLORS.text.tertiary,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },

  cardTitle: {
    fontFamily: FONT.bold,
    fontSize: 16,
    marginBottom: 8,
  },
  cardContent: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: "#333",
  },
  cardInfo: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
