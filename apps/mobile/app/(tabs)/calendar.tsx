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
} from "@elepad/api-client";
import { COLORS, STYLES as baseStyles } from "@/styles/base";
import { Text, Modal, Button } from "react-native-paper";
import AppDialog from "@/components/AppDialog";

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
  const postActivity = usePostActivities();
  const patchActivity = usePatchActivitiesId({
    mutation: {
      retry: 2, // Solo 2 reintentos
      retryDelay: 1000, // 1 segundo entre reintentos
    },
  });
  const deleteActivity = useDeleteActivitiesId();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleSave = async (payload: Partial<Activity>) => {
    if (editing) {
      const { status } = await patchActivity.mutateAsync({
        id: editing.id,
        data: payload as UpdateActivity,
      });
      if (status !== 200) {
        setDialogTitle("Algo salió mal.");
        setDialogMessage(
          "El estado de la actividad no se pudo actualizar. Por favor, inténtalo de nuevo.",
        );
      } else {
        setDialogTitle("Listo");
        setDialogMessage(
          "El estado de la actividad se actualizó correctamente.",
        );
      }
    } else {
      const { status } = await postActivity.mutateAsync({
        data: {
          ...payload,
          createdBy: idUser,
          startsAt: payload.startsAt!,
        } as NewActivity,
      });
      if (status !== 201) {
        setDialogTitle("Algo salió mal.");
        setDialogMessage(
          "No pudimos crear la actividad. Por favor, inténtalo de nuevo.",
        );
      } else {
        setDialogTitle("Listo");
        setDialogMessage("La actividad se creó correctamente.");
      }
    }
    setFormVisible(false);
    setEditing(null);
    showDialog();
    await activitiesQuery.refetch();
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
    // Actualización optimista: actualizamos inmediatamente el cache
    const queryKey = activitiesQuery.queryKey;

    // Guardamos el estado anterior para rollback
    await queryClient.cancelQueries({ queryKey });
    const previousActivities = queryClient.getQueryData(queryKey);

    // Actualizamos optimísticamente el cache
    queryClient.setQueryData(queryKey, (old: any) => {
      if (Array.isArray(old)) {
        return old.map((act: Activity) =>
          act.id === activity.id ? { ...act, completed: !act.completed } : act,
        );
      }
      return old;
    });

    try {
      // Enviamos la petición al backend con timeout
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000), // 4 segundos timeout
      );

      await Promise.race([
        patchActivity.mutateAsync({
          id: activity.id,
          data: {
            title: activity.title,
            startsAt: activity.startsAt,
            endsAt: activity.endsAt,
            completed: !activity.completed,
          } as UpdateActivity,
        }),
        timeoutPromise,
      ]);
    } catch (error) {
      // Si hay error, revertimos el cambio optimista
      console.error("Error al actualizar actividad:", error);
      queryClient.setQueryData(queryKey, previousActivities);
      setDialogTitle("Error");
      setDialogMessage(
        "No se pudo actualizar el estado de la actividad. Por favor, inténtalo de nuevo.",
      );
      showDialog();
    }
  };

  return (
    <View style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View
        style={{
          flex: 1,
          padding: 16,
          paddingTop: "15%",
          justifyContent: "flex-start",
        }}
      >
        <Text style={baseStyles.superHeading}>Calendario Grupal</Text>
        <CalendarCard
          idFamilyGroup={familyCode}
          idUser={idUser}
          activitiesQuery={activitiesQuery}
          onEdit={handleEdit}
          onDelete={handleConfirmDelete}
          onToggleComplete={handleToggleComplete}
          setFormVisible={setFormVisible}
        />
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
            <Button
              onPress={handleDelete}
              mode="contained"
              buttonColor="#ff2020"
            >
              Eliminar
            </Button>
          </View>
        </Modal>
      </View>
    </View>
  );
}
