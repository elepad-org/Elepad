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

export default function FamilyGroupScreen() {
  const { userElepad } = useAuth();
  const groupId = userElepad?.familyGroupId;

  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");

  const membersQuery = useGetFamilyGroupIdGroupMembers({ idGroup: groupId });
  const patchFamilyGroup = usePatchFamilyGroupIdGroup();

  const selectGroupInfo = () => {
    const data = membersQuery.data?.data;
    return data?.group || null;
  };

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={baseStyles.contentContainer}>
        <View style={baseStyles.footer}>
          {/* Nombre del grupo */}
          {(() => {
            const groupInfo = selectGroupInfo();
            const groupName = groupInfo?.name;
            if (!groupName) return null;
            return (
              <View style={baseStyles.card}>
                {isEditing ? (
                  <View style={baseStyles.center}>
                    <Text style={baseStyles.heading}>Editar grupo</Text>
                    <TextInput
                      style={baseStyles.input}
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      placeholder="Nombre del grupo"
                      autoFocus
                    />
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
                      disabled={isUpdating}
                      loading={isUpdating}
                      style={baseStyles.buttonPrimary}
                      contentStyle={baseStyles.buttonContent}
                    >
                      Guardar
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => setIsEditing(false)}
                      disabled={isUpdating}
                      style={baseStyles.buttonSecondary}
                      contentStyle={baseStyles.buttonContent}
                    >
                      Cancelar
                    </Button>
                  </View>
                ) : (
                  <View style={baseStyles.center}>
                    <Text style={baseStyles.subheading}>Tu grupo familiar</Text>
                    <Text style={baseStyles.heading}>{groupName}</Text>
                    <Button
                      mode="text"
                      onPress={() => {
                        setNewGroupName(groupName);
                        setIsEditing(true);
                      }}
                      style={baseStyles.buttonSecondary}
                      contentStyle={baseStyles.buttonContent}
                    >
                      Editar nombre
                    </Button>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Lista de miembros */}
          <View style={baseStyles.card}>
            <Text style={baseStyles.heading}>Miembros del grupo</Text>
            {membersQuery.isLoading ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : membersQuery.error ? (
              <Text
                style={[
                  baseStyles.subheading,
                  { color: COLORS.error, marginVertical: 16 },
                ]}
              >
                Error cargando miembros
              </Text>
            ) : (
              (() => {
                const groupInfo = selectGroupInfo();
                const membersArray = groupInfo?.members;

                if (!membersArray || membersArray.length === 0) {
                  return (
                    <Text
                      style={[baseStyles.subheading, { marginVertical: 20 }]}
                    >
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
                      marginVertical: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      {m.avatarUrl ? (
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View style={baseStyles.memberAvatarPlaceholder}>
                          <Text style={baseStyles.memberInitials}>
                            {getInitials(m.displayName)}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[baseStyles.subheading, { color: COLORS.text }]}
                      >
                        {m.displayName}
                      </Text>
                    </View>
                  </View>
                ));
              })()
            )}
          </View>

          {/* Botón para crear enlace de invitación */}
          <Button
            mode="contained"
            onPress={async () => {
              if (!groupId) return;
              try {
                const data = await getFamilyGroupIdGroupInvite(groupId, {});
                setInvitationCode(data.data.invitationCode || "");
              } catch (error) {
                console.error("Error creating invitation:", error);
              }
            }}
            contentStyle={baseStyles.buttonContent}
            style={baseStyles.buttonPrimary}
          >
            Crear enlace de invitación
          </Button>

          {invitationCode && (
            <View style={baseStyles.card}>
              <Text style={baseStyles.heading}>Código de invitación</Text>
              <Text style={[baseStyles.brand, { fontSize: 24, marginTop: 12 }]}>
                {String(invitationCode)}
              </Text>
              <Text style={baseStyles.subheading}>
                Expira 10 minutos luego de su creación.
              </Text>
            </View>
          )}

          <Link href="/" style={baseStyles.footerText}>
            Volver
          </Link>
        </View>
        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={2200}
          >
            ✓ Grupo actualizado
          </Snackbar>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}
