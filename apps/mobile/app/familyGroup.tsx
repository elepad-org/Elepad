import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { Appbar, Button, Divider, Portal, Snackbar } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import {
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200Item,
} from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import { FONT } from "@/styles/theme";

const colors = {
  primary: "#7fb3d3",
  white: "#f9f9f9ff",
  background: "#F4F7FF",
};

export default function FamilyGroup() {
  const router = useRouter();

  const { userElepad, refreshUserElepad } = useAuth();
  const [invitationCode, setInvitationCode] =
    useState<getFamilyGroupIdGroupInviteResponse>();

  const groupId = userElepad?.groupId;

  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Fetch group members via the generated React Query hook
  const {
    data: membersRes,
    isLoading: membersLoading,
    error: membersError,
  } = useGetFamilyGroupIdGroupMembers(groupId ?? "");

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
          //Mostramos los miembros del grupo Familiar
          <View style={styles.membersSection}>
            <Text style={styles.membersTitle}>Miembros del grupo</Text>
            {membersLoading ? (
              <ActivityIndicator style={styles.membersLoading} />
            ) : membersError ? (
              <Text style={styles.membersError}>Error cargando miembros</Text>
            ) : (
              (() => {
                // La API/cliente puede devolver directamente un array o un objeto { data: [...] }
                const membersArray:
                  | GetFamilyGroupIdGroupMembers200Item[]
                  | undefined = Array.isArray(membersRes)
                  ? (membersRes as unknown as GetFamilyGroupIdGroupMembers200Item[])
                  : Array.isArray(membersRes?.data)
                    ? (membersRes.data as GetFamilyGroupIdGroupMembers200Item[])
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
                ));
              })()
            )}
          </View>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
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
});
