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
  Appbar,
  Button,
  Portal,
  Snackbar,
  Text,
  IconButton,
  Dialog,
} from "react-native-paper";
import { Link } from "expo-router";
import {
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200Item,
  useRemoveUserFromFamilyGroup,
} from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import { FONT } from "@/styles/theme";

const colors = {
  primary: "#7fb3d3",
  white: "#f9f9f9ff",
  background: "#F4F7FF",
};

export default function FamilyGroup() {
  const { userElepad } = useAuth();
  const [invitationCode, setInvitationCode] =
    useState<getFamilyGroupIdGroupInviteResponse>();

  const groupId = userElepad?.groupId;

  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Confirmación de eliminación
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<GetFamilyGroupIdGroupMembers200Item | null>(null);

  // Fetch group members via the generated React Query hook
  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId ?? "");
  const removeMember = useRemoveUserFromFamilyGroup();

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

  const openConfirm = (member: GetFamilyGroupIdGroupMembers200Item) => {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Appbar.Header
        mode="center-aligned"
        elevated
        style={{ backgroundColor: colors.primary }}
      >
        <Appbar.Content title="Grupo Familiar" color="#fff" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.footer}>
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
          {/* Mostramos los miembros del grupo Familiar */}
          <View style={styles.membersSection}>
            <Text style={styles.membersTitle}>Miembros del grupo</Text>
            {membersQuery.isLoading ? (
              <ActivityIndicator style={styles.membersLoading} />
            ) : membersQuery.error ? (
              <Text style={styles.membersError}>Error cargando miembros</Text>
            ) : (
              (() => {
                // La API/cliente puede devolver directamente un array o un objeto { data: [...] }
                const membersArray:
                  | GetFamilyGroupIdGroupMembers200Item[]
                  | undefined = Array.isArray(membersQuery.data)
                  ? (membersQuery.data as unknown as GetFamilyGroupIdGroupMembers200Item[])
                  : Array.isArray(membersQuery.data?.data)
                    ? (membersQuery.data
                        .data as GetFamilyGroupIdGroupMembers200Item[])
                    : undefined;

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
            href={{ pathname: "/" }}
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
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-start",
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
  successSnackbar: {
    backgroundColor: "green",
  },
  inlineBack: {
    textAlign: "center",
    fontFamily: FONT.regular,
    fontSize: 14,
    color: "#666",
  },
  /* Members list styles */
  membersSection: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  membersTitle: {
    fontSize: 16,
    fontFamily: FONT.regular,
    marginBottom: 8,
    color: "#0f172a",
  },
  membersLoading: {
    marginVertical: 8,
  },
  membersError: {
    color: "red",
  },
  noMembersText: {
    color: "#666",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#7fb3d3",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitials: {
    color: "#fff",
    fontWeight: "700",
  },
  memberName: {
    fontSize: 15,
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
    elevation: 2,
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
    color: "#666",
  },
});
