import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
} from "react-native";
import { Appbar, Button, Portal, Snackbar } from "react-native-paper";
import { useRouter } from "expo-router";
import {
  getFamilyGroupIdGroupInvite,
  getFamilyGroupIdGroupInviteResponse,
  getPostFamilyGroupLinkUrl,
  useGetFamilyGroupIdGroupInvite,
} from "@elepad/api-client";
import { useAuth } from "@/hooks/useAuth";

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
  profileHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    textAlign: "center",
  },
  subtitle: {
    color: "#667085",
    textAlign: "center",
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
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
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  photoActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  helperText: {
    marginTop: 4,
    color: "#6b7280",
  },
});
