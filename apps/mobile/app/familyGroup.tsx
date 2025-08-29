import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
} from "react-native";
import { Appbar, Button, Divider, Portal, Snackbar } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import {
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
} from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200Item,
} from "@elepad/api-client";
import { Avatar, List, Text } from "react-native-paper";
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

  //Con esto lo que hago es mockear miembros que dps muestro
  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useGetFamilyGroupIdGroupMembers(groupId ?? "", {
    query: { enabled: !!groupId },
  });

  // Mock data fallback (useful for development without backend)
  const mockMembers: GetFamilyGroupIdGroupMembers200Item[] = [
    {
      id: "dfccc337-1ef5-4cb8-aed5-5ad83dec4446",
      displayName: "Maestro Kamacho",
      avatarUrl: null,
    },
    {
      id: "315e04f4-55fc-4514-a38d-3d01ce285860",
      displayName: "Paulo Londra",
      avatarUrl:
        "https://sdnmoweppzszpxyggdyg.supabase.co/storage/v1/object/public/profile-avatar/315e04f4-55fc-4514-a38d-3d01ce285860/1756027531421-8b2c8918-ad02-40cf-9374-96f941994e7a.jpeg",
    },
    {
      id: "add3955f-39f8-4d8f-b43f-4abe51745174",
      displayName: "arrejinsixtoup",
      avatarUrl: null,
    },
  ];

  const membersToShow =
    (membersData && Array.isArray(membersData.data) && membersData.data) ||
    (__DEV__ ? mockMembers : []);

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
          <Divider style={{ marginVertical: 20 }} />
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
        <View>
          <Text style={{ marginBottom: 8, fontFamily: FONT.bold }}>
            Miembros
          </Text>
          {membersLoading && <Text>Cargando miembros...</Text>}
          {membersError && (
            <Text onPress={() => refetchMembers()} style={{ color: "red" }}>
              Error cargando miembros. Tocar para reintentar.
            </Text>
          )}
          {!membersLoading && membersToShow.length === 0 && (
            <Text>No hay miembros en este grupo.</Text>
          )}
          {membersToShow.length > 0 && (
            <View>
              {membersToShow.map((m: GetFamilyGroupIdGroupMembers200Item) => (
                <List.Item
                  key={m.id}
                  title={m.displayName}
                  left={() => (
                    <Avatar.Image
                      size={40}
                      source={
                        m.avatarUrl
                          ? { uri: m.avatarUrl }
                          : require("../assets/images/bbb.png")
                      }
                    />
                  )}
                />
              ))}
            </View>
          )}
        </View>
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
