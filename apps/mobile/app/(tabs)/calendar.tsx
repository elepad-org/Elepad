import { useState } from "react";
import { View, StatusBar } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
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
  getActivitiesFamilyCodeIdFamilyGroupResponse,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200,
} from "@elepad/api-client";
import { COLORS, STYLES as baseStyles } from "@/styles/base";
import { Text, Modal, Button } from "react-native-paper";
import AppDialog from "@/components/AppDialog";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const { userElepad } = useAuth();
  const familyCode = userElepad?.groupId ?? "";
  const idUser = userElepad?.id ?? "";
  const queryClient = useQueryClient();

  const [dialogVisible, setDialogVisible] = useState(false);

  const showDialog = () => setDialogVisible(true);

  const hideDialog = () => setDialogVisible(false);

  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

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
        setDialogTitle("Listo");
        setDialogMessage("La actividad se creó correctamente.");
        setFormVisible(false);
        setEditing(null);
        showDialog();
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
        setDialogTitle("Listo");
        setDialogMessage("La actividad se actualizó correctamente.");
        setFormVisible(false);
        setEditing(null);
        showDialog();
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
        setDialogTitle("Actividad eliminada");
        setDialogMessage("La actividad se eliminó correctamente.");
        showDialog();
        await activitiesQuery.refetch();
      },
      onError: (error) => {
        console.error("Error al eliminar actividad:", error);
        setDialogTitle("Error");
        setDialogMessage(
          "No se pudo eliminar la actividad. Por favor, inténtalo de nuevo.",
        );
        showDialog();
      },
    },
  });

  // Mutación separada para toggle con actualización optimista
  const toggleActivity = usePatchActivitiesId({
    mutation: {
      retry: 1, // Solo 1 reintento
      retryDelay: 500, // 500ms entre reintentos
      onSuccess: () => {
        // No hacemos refetch aquí para mantener la UI instantánea
        // El servidor ya confirmó el cambio
      },
      onError: (error) => {
        console.error("Error al actualizar actividad:", error);
        // El rollback se maneja en handleToggleComplete
        setDialogTitle("Error");
        setDialogMessage(
          "No se pudo actualizar el estado de la actividad. Por favor, inténtalo de nuevo.",
        );
        showDialog();
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
    setDialogTitle("Actividad eliminada");
    setDialogMessage("La actividad se eliminó correctamente.");
    setDeleteModalVisible(false);
    setEventToDelete(null);
    showDialog();
  };

  const handleToggleComplete = async (activity: Activity) => {
    // Construimos la queryKey directamente
    const queryKey = [`/activities/familyCode/${familyCode}`];

    // Cancelamos cualquier refetch en progreso
    await queryClient.cancelQueries({ queryKey });

    // Guardamos el estado previo por si necesitamos revertir
    const previousData =
      queryClient.getQueryData<getActivitiesFamilyCodeIdFamilyGroupResponse>(
        queryKey,
      );

    // Actualizamos optimísticamente el cache de forma SÍNCRONA
    queryClient.setQueryData<getActivitiesFamilyCodeIdFamilyGroupResponse>(
      queryKey,
      (old) => {
        if (!old) return old;

        // Caso 1: Los datos son un array plano (formato simplificado de React Query)
        if (Array.isArray(old)) {
          return old.map((act: Activity) =>
            act.id === activity.id
              ? { ...act, completed: !act.completed }
              : act,
          ) as unknown as getActivitiesFamilyCodeIdFamilyGroupResponse;
        }

        // Caso 2: Los datos tienen la estructura completa { data, status, headers }
        if ("data" in old && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((act: Activity) =>
              act.id === activity.id
                ? { ...act, completed: !act.completed }
                : act,
            ),
          } as getActivitiesFamilyCodeIdFamilyGroupResponse;
        }

        return old;
      },
    );

    // Ejecutamos la mutación en background con timeout
    try {
      const updateData: UpdateActivity = {
        startsAt: activity.startsAt,
        completed: !activity.completed,
      };

      // Solo incluir campos opcionales si tienen valor
      if (activity.title) {
        updateData.title = activity.title;
      }
      if (activity.endsAt !== null && activity.endsAt !== undefined) {
        updateData.endsAt = activity.endsAt;
      }
      if (activity.description !== null && activity.description !== undefined) {
        updateData.description = activity.description;
      }

      // Timeout de 3 segundos para la petición
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000),
      );

      await Promise.race([
        toggleActivity.mutateAsync({
          id: activity.id,
          data: updateData,
        }),
        timeoutPromise,
      ]);

      // No hacemos invalidateQueries para evitar el refetch y mantener la UI instantánea
      // El cache ya está actualizado optimísticamente
    } catch (error) {
      // En caso de error, revertimos al estado anterior
      queryClient.setQueryData(queryKey, previousData);
      console.error("Error al actualizar actividad:", error);
    }
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
          onToggleComplete={handleToggleComplete}
          isOwnerOfGroup={isOwnerOfGroup}
          groupInfo={groupInfo}
        />
      </View>

      <AppDialog
        visible={dialogVisible}
        onClose={hideDialog}
        title={dialogTitle}
        message={dialogMessage}
      />
      <ActivityForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing ?? null}
      />

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        contentContainerStyle={{
          backgroundColor: "#fff",
          padding: 24,
          margin: 32,
          borderRadius: 16,
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 16 }}>
          ¿Seguro que quieres eliminar este evento?
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button
            onPress={() => setDeleteModalVisible(false)}
            style={{ marginRight: 8 }}
            mode="outlined"
          >
            Cancelar
          </Button>
          <Button onPress={handleDelete} mode="contained" buttonColor="#ff2020">
            Eliminar
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
