import { useState } from "react";
import { View, StatusBar } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import CalendarCard from "@/components/Calendar/CalendarCard";
import ActivityForm from "@/components/Calendar/ActivityForm";
import {
  usePostActivities,
  usePatchActivitiesId,
  useDeleteActivitiesId,
  Activity,
  NewActivity,
  UpdateActivity,
  useGetActivitiesFamilyCodeIdFamilyGroup,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200,
} from "@elepad/api-client";
import { COLORS, STYLES as baseStyles } from "@/styles/base";
import { Text, Dialog, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CancelButton from "@/components/shared/CancelButton";
import SuccessSnackbar from "@/components/shared/SuccessSnackbar";
import ErrorSnackbar from "@/components/shared/ErrorSnackbar";

export default function CalendarScreen() {
  const { userElepad } = useAuth();
  const familyCode = userElepad?.groupId ?? "";
  const idUser = userElepad?.id ?? "";

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success",
  );

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const activitiesQuery = useGetActivitiesFamilyCodeIdFamilyGroup(familyCode);
  const membersQuery = useGetFamilyGroupIdGroupMembers(familyCode);

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

  const groupInfo = selectGroupInfo();
  const isOwnerOfGroup = groupInfo?.owner?.id === userElepad?.id;

  const postActivity = usePostActivities({
    mutation: {
      retry: 2, // Reintentar 2 veces antes de fallar
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff: 1s, 2s
      onSuccess: async () => {
        setSnackbarMessage("Actividad creada correctamente");
        setSnackbarType("success");
        setFormVisible(false);
        setEditing(null);
        setSnackbarVisible(true);
        await activitiesQuery.refetch();
      },
      onError: (error) => {
        console.error("Error al crear actividad:", error);
        // NO cerramos el formulario para que el usuario no pierda los datos
        // El error se maneja dentro del formulario
      },
    },
  });

  const patchActivity = usePatchActivitiesId({
    mutation: {
      retry: 2, // Reintentar 2 veces antes de fallar
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff: 1s, 2s
      onSuccess: async () => {
        setSnackbarMessage("Actividad actualizada correctamente");
        setSnackbarType("success");
        setFormVisible(false);
        setEditing(null);
        setSnackbarVisible(true);
        await activitiesQuery.refetch();
      },
      onError: (error) => {
        console.error("Error al actualizar actividad:", error);
        // NO cerramos el formulario para que el usuario no pierda los datos
        // El error se maneja dentro del formulario
      },
    },
  });

  const deleteActivity = useDeleteActivitiesId({
    mutation: {
      onSuccess: async () => {
        setSnackbarMessage("Actividad eliminada correctamente");
        setSnackbarType("success");
        setSnackbarVisible(true);
        await activitiesQuery.refetch();
      },
      onError: (error) => {
        console.error("Error al eliminar actividad:", error);
        setSnackbarMessage("No se pudo eliminar la actividad");
        setSnackbarType("error");
        setSnackbarVisible(true);
      },
    },
  });

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleSave = async (payload: Partial<Activity>) => {
    // No usamos try-catch aquí, dejamos que el error se propague al formulario
    if (editing) {
      await patchActivity.mutateAsync({
        id: editing.id,
        data: payload as UpdateActivity,
      });
    } else {
      await postActivity.mutateAsync({
        data: {
          ...payload,
          createdBy: idUser,
          startsAt: payload.startsAt!,
        } as NewActivity,
      });
    }
    // Los callbacks onSuccess de las mutaciones ya manejan el cierre del form y el diálogo
  };

  const handleEdit = (ev: Activity) => {
    setEditing(ev);
    setFormVisible(true);
  };

  const handleConfirmDelete = (id: string) => {
    setEventToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (eventToDelete) {
      await deleteActivity.mutateAsync({ id: eventToDelete });
      await activitiesQuery.refetch();
    }
    setDeleteModalVisible(false);
    setEventToDelete(null);
  };

  return (
    <SafeAreaView style={baseStyles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={baseStyles.superHeading}>Calendario</Text>
        <Button
          mode="contained"
          onPress={() => setFormVisible(true)}
          style={{ ...baseStyles.miniButton }}
          icon="plus"
        >
          Agregar
        </Button>
      </View>

      <View style={{ flex: 1 }}>
        <CalendarCard
          idFamilyGroup={familyCode}
          idUser={idUser}
          activitiesQuery={activitiesQuery}
          onEdit={handleEdit}
          onDelete={handleConfirmDelete}
          isOwnerOfGroup={isOwnerOfGroup}
          groupInfo={groupInfo}
        />
      </View>

      <ActivityForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing ?? null}
      />

      <Dialog
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        style={{
          backgroundColor: COLORS.background,
          width: "90%",
          alignSelf: "center",
          borderRadius: 16,
          paddingVertical: 14,
        }}
      >
        <Dialog.Title style={{ ...baseStyles.heading, paddingTop: 8 }}>
          Eliminar evento
        </Dialog.Title>
        <Dialog.Content style={{ paddingBottom: 8 }}>
          <Text style={{ ...baseStyles.subheading, marginTop: 0 }}>
            ¿Estás seguro que quieres eliminar este evento?
          </Text>
        </Dialog.Content>
        <Dialog.Actions
          style={{
            paddingBottom: 12,
            paddingHorizontal: 20,
            justifyContent: "space-between",
          }}
        >
          <CancelButton onPress={() => setDeleteModalVisible(false)} />
          <Button
            onPress={handleDelete}
            mode="contained"
            buttonColor={COLORS.secondary}
            style={{ borderRadius: 12, paddingHorizontal: 24 }}
          >
            Eliminar
          </Button>
        </Dialog.Actions>
      </Dialog>

      {snackbarType === "success" ? (
        <SuccessSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMessage}
        />
      ) : (
        <ErrorSnackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMessage}
        />
      )}
    </SafeAreaView>
  );
}
