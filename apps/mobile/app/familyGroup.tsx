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

  console.log(membersRes);

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
          <View style={{ marginTop: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>
              Miembros del grupo
            </Text>
            {membersLoading ? (
              <ActivityIndicator />
            ) : membersError ? (
              <Text style={{ color: "red" }}>Error cargando miembros</Text>
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
                    <Text style={{ color: "#666" }}>
                      No hay miembros para mostrar
                    </Text>
                  );
                }

                return membersArray.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: 6,
                    }}
                  >
                    {m.avatarUrl ? (
                      <Image
                        source={{ uri: m.avatarUrl }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                    ) : null}
                    <Text style={{ marginLeft: 8 }}>{m.displayName}</Text>
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
});
