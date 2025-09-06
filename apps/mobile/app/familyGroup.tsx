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
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  useGetFamilyGroupIdGroupMembers,
  useRemoveUserFromFamilyGroup,
  usePatchFamilyGroupIdGroup,
} from "@elepad/api-client";
import type { GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import { FONT } from "@/styles/theme";
import { COLORS, styles as baseStyles } from "@/styles/base";
import { Pressable } from "react-native";

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

  // Fetch group members via the generated React Query hook
  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId ?? "");
  const removeMember = useRemoveUserFromFamilyGroup();

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

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={baseStyles.contentContainer}>
        <View style={baseStyles.footer}>
          {/* Nombre del grupo (centrado y lindo) */}
          {(() => {
            const groupInfo = selectGroupInfo();
            const groupName = groupInfo?.name;
            if (!groupName) return null;
            return (
              <View style={baseStyles.groupHeaderCard}>
                {isEditing ? (
                  <View style={baseStyles.editContainer}>
                    <TextInput
                      style={baseStyles.nameInput}
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      autoFocus
                    />
                    <View style={baseStyles.editButtons}>
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
                    style={baseStyles.nameContainer}
                  >
                    <Text style={baseStyles.groupHeaderSubtitle}>
                      Grupo Familiar
                    </Text>
                    <View style={baseStyles.nameRowContainer}>
                      <Text style={baseStyles.groupHeaderTitle}>
                        {groupName}
                      </Text>
                      <IconButton
                        icon="pencil"
                        size={18}
                        iconColor="#64748b"
                        style={baseStyles.editIcon}
                      />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })()}
          {/* Mostramos los miembros del grupo Familiar */}
          <View style={baseStyles.membersSection}>
            {/* Antes de los miembros debemos mostrar centrado y lindo el nombre del grupo */}

            <Text style={baseStyles.membersTitle}>Miembros del grupo</Text>
            {(() => {
              const groupInfo = selectGroupInfo();
              if (!groupInfo) return null;
              const o = groupInfo.owner;
              return (
                <View style={[baseStyles.memberRow, { borderBottomWidth: 0 }]}>
                  <View style={baseStyles.memberInfo}>
                    {o.avatarUrl ? (
                      <Image
                        source={{ uri: o.avatarUrl }}
                        style={baseStyles.memberAvatar}
                      />
                    ) : (
                      <View style={baseStyles.memberAvatarPlaceholder}>
                        <Text style={baseStyles.memberInitials}>
                          {getInitials(o.displayName)}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={baseStyles.memberName}>{o.displayName}</Text>
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
              <ActivityIndicator style={baseStyles.membersLoading} />
            ) : membersQuery.error ? (
              <Text style={baseStyles.membersError}>
                Error cargando miembros
              </Text>
            ) : (
              (() => {
                const groupInfo = selectGroupInfo();
                const membersArray = groupInfo?.members;

                if (!membersArray || membersArray.length === 0) {
                  return (
                    <Text style={baseStyles.noMembersText}>
                      No hay miembros para mostrar
                    </Text>
                  );
                }

                return membersArray.map((m) => (
                  <View key={m.id} style={baseStyles.memberRow}>
                    <View style={baseStyles.memberInfo}>
                      {m.avatarUrl ? (
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={baseStyles.memberAvatar}
                        />
                      ) : (
                        <View style={baseStyles.memberAvatarPlaceholder}>
                          <Text style={baseStyles.memberInitials}>
                            {getInitials(m.displayName)}
                          </Text>
                        </View>
                      )}
                      <Text style={baseStyles.memberName}>{m.displayName}</Text>
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

          <Button
            mode="contained"
            icon="account-multiple-plus"
            onPress={() => {
              createInvitationCode();
            }}
            contentStyle={baseStyles.buttonContent}
            style={baseStyles.buttonPrimary}
          >
            Crear enlace de invitación
          </Button>

          {invitationCode && (
            <View style={baseStyles.card}>
              <Text style={baseStyles.cardTitle}>Código de invitación</Text>
              <Text style={baseStyles.cardContent}>
                {String(invitationCode)}
              </Text>
              <Text style={baseStyles.cardInfo}>
                Expira 10 minutos luego de su creación.
              </Text>
            </View>
          )}
          <Link
            href={{ pathname: "/perfil" }}
            accessibilityRole="button"
            style={baseStyles.inlineBack}
          >
            Volver
          </Link>
        </View>
        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
            style={baseStyles.successSnackbar}
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
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
