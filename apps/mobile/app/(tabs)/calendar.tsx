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
import { Text, Modal, Button, Portal, Dialog } from "react-native-paper";

export default function CalendarScreen() {
  const { userElepad } = useAuth();
  const familyCode = userElepad?.groupId ?? "";
  const idUser = userElepad?.id ?? "";
  const queryClient = useQueryClient();

  const [successDialogVisible, setSuccessDialogVisible] = useState(false);

  const showSuccessDialog = () => setSuccessDialogVisible(true);

  const hideSuccessDialog = () => setSuccessDialogVisible(false);

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
    setFormVisible(false);
    setEditing(null);
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
    setDeleteModalVisible(false);
    setEventToDelete(null);
    showSuccessDialog();
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
        <View>
          <Portal>
            <Dialog
              visible={successDialogVisible}
              onDismiss={hideSuccessDialog}
              style={{
                backgroundColor: "#fff",
                //padding: 24,
                marginTop: "-15%",
                borderRadius: 16,
              }}
            >
              <Dialog.Title>Evento eliminado</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyLarge">
                  El evento se eliminó correctamente
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button
                  onPress={hideSuccessDialog}
                  mode="contained"
                  buttonColor={COLORS.secondary}
                  textColor="#ffffffff"
                  style={{ borderRadius: 10 }}
                >
                  Aceptar
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
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
