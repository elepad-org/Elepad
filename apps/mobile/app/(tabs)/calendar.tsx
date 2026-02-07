import { useState, useMemo, useEffect } from "react";
import { View, StatusBar } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCalendarTour } from "@/hooks/tours/useCalendarTour";
import { useTabContext } from "@/context/TabContext";
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
import { Text, Dialog, Button, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CancelButton from "@/components/shared/CancelButton";
import { useToast } from "@/components/shared/Toast";
import { toLocalDateString, getTodayLocal } from "@/lib/dateHelpers";
import { useQueryClient } from "@tanstack/react-query";


function CalendarScreenContent() {
  const { userElepad } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const familyCode = userElepad?.groupId ?? "";
  const idUser = userElepad?.id ?? "";
  const queryClient = useQueryClient();

  const { showToast } = useToast();
  const [googleCalendarEnabled] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Partial<Activity> | null>(null);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);
  const activitiesQuery = useGetActivitiesFamilyCodeIdFamilyGroup(familyCode);
  const membersQuery = useGetFamilyGroupIdGroupMembers(familyCode);

  const [selectedDay, setSelectedDay] = useState<string>(getTodayLocal());

  const { activeTab } = useTabContext();

  //  // Tour hook
  //  // Tour hook
  const { headerRef, addButtonRef, calendarViewRef, taskListRef } = useCalendarTour({
    activeTab,
    activitiesLoading: activitiesQuery.isLoading,
  });
  // ------------------



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

  // Preparar lista de miembros de la familia para menciones y selector de destinatarios
  const familyMembers = useMemo(() => {
    if (!groupInfo) {
      return [] as Array<{
        id: string;
        displayName: string;
        avatarUrl: string | null;
        elder: boolean;
        activeFrameUrl: string | null;
      }>;
    }

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<
      string,
      {
        id: string;
        displayName: string;
        avatarUrl: string | null;
        elder: boolean;
        activeFrameUrl: string | null;
      }
    >();
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, {
        id: m.id,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl ?? null,
        elder: m.elder ?? false,
        activeFrameUrl: m.activeFrameUrl ?? null,
      });
    }
    return Array.from(byId.values());
  }, [groupInfo]);

  const postActivity = usePostActivities({
    mutation: {
      retry: 2, // Reintentar 2 veces antes de fallar
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff: 1s, 2s
      onSuccess: async () => {
        showToast({
          message:
            "Actividad creada correctamente" +
            (googleCalendarEnabled
              ? " y sincronizada con Google Calendar"
              : ""),
          type: "success",
        });
        setFormVisible(false);
        setEditing(null);
        // Invalidar caché para forzar actualización inmediata
        // Usar la queryKey provista por el hook para invalidar exactamente esa query
        try {
          queryClient.invalidateQueries({ queryKey: activitiesQuery.queryKey as readonly unknown[] });
        } catch (err) {
          console.warn("invalidateQueries with queryKey failed, falling back:", err);
          queryClient.invalidateQueries({ queryKey: ["/activities/family-code/{id}/family-group"] });
          queryClient.invalidateQueries({ queryKey: ["/activities"] });
        }
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
        showToast({
          message:
            "Actividad actualizada correctamente" +
            (googleCalendarEnabled
              ? " y sincronizada con Google Calendar"
              : ""),
          type: "success",
        });
        setFormVisible(false);
        setEditing(null);
        // Invalidar caché para forzar actualización inmediata
        try {
          queryClient.invalidateQueries({ queryKey: activitiesQuery.queryKey as readonly unknown[] });
        } catch (err) {
          console.warn("invalidateQueries with queryKey failed, falling back:", err);
          queryClient.invalidateQueries({ queryKey: ["/activities/family-code/{id}/family-group"] });
          queryClient.invalidateQueries({ queryKey: ["/activities"] });
        }
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
        showToast({
          message:
            "Actividad eliminada correctamente" +
            (googleCalendarEnabled ? " y eliminada de Google Calendar" : ""),
          type: "success",
        });
        // Invalidar caché para forzar actualización inmediata
        try {
          queryClient.invalidateQueries({ queryKey: activitiesQuery.queryKey as readonly unknown[] });
        } catch (err) {
          console.warn("invalidateQueries with queryKey failed, falling back:", err);
          queryClient.invalidateQueries({ queryKey: ["/activities/family-code/{id}/family-group"] });
          queryClient.invalidateQueries({ queryKey: ["/activities"] });
        }
      },
      onError: (error) => {
        console.error("Error al eliminar actividad:", error);
        showToast({
          message: "No se pudo eliminar la actividad",
          type: "error",
        });
      },
    },
  });

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [activityToView, setActivityToView] = useState<string | null>(null);
  const [activityDateToView, setActivityDateToView] = useState<string | null>(
    null,
  );

  // Detectar cuando se pasa un activityId desde notificaciones o desde home
  useEffect(() => {
    if (
      params.activityId &&
      typeof params.activityId === "string" &&
      activitiesQuery.data
    ) {
      const activities = Array.isArray(activitiesQuery.data)
        ? activitiesQuery.data
        : (activitiesQuery.data as { data?: Activity[] }).data || [];

      const activity = activities.find(
        (a: Activity) => a.id === params.activityId,
      );
      if (activity) {
        console.log("📅 Opening activity from params:", {
          id: params.activityId,
          title: activity.title,
          startsAt: activity.startsAt,
        });
        // Establecer la actividad a visualizar
        setActivityToView(params.activityId);
        // Establecer la fecha de la actividad en hora local (formato YYYY-MM-DD)
        const activityDate = toLocalDateString(new Date(activity.startsAt));
        console.log("📅 Activity date in local timezone:", activityDate);
        setActivityDateToView(activityDate);
      } else {
        console.warn("⚠️ Activity not found:", params.activityId);
      }
      // Limpiar el parámetro de la URL después de un pequeño delay para asegurar que se procese
      setTimeout(() => {
        router.setParams({ activityId: undefined });
      }, 200);
    }
  }, [params.activityId, activitiesQuery.data]);

  // Detectar cuando se pasa el parámetro openForm para abrir el modal de agregar evento
  useEffect(() => {
    if (params.openForm === "true") {
      setFormVisible(true);
      // Limpiar el parámetro de la URL inmediatamente para evitar que se vuelva a abrir
      router.setParams({ openForm: undefined });
    }
  }, [params.openForm]);

  const handleActivityViewed = () => {
    // Resetear el estado cuando se cierra el modal
    setActivityToView(null);
    setActivityDateToView(null);
  };

  const handleSave = async (payload: Partial<Activity>) => {
    // No usamos try-catch aquí, dejamos que el error se propague al formulario
    if (editing && editing.id) {
      await patchActivity.mutateAsync({
        id: editing.id,
        data: payload as UpdateActivity,
      });
    } else {
      await postActivity.mutateAsync({
        data: {
          ...payload,
          createdBy: idUser,
          assignedTo: payload.assignedTo || idUser, // Fallback por seguridad
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
          paddingTop: 20,
          paddingBottom: 8,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View ref={headerRef}>
          <Text
            style={baseStyles.superHeading}
            suppressHighlighting={true}
          >
            Calendario
          </Text>
        </View>

        <View ref={addButtonRef}>
          <Button
            mode="contained"
            onPress={() => {
              // Combinar el día seleccionado con la hora actual
              const now = new Date();
              const [year, month, day] = selectedDay.split("-").map(Number);
              const startDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes());
              setEditing({ startsAt: startDate.toISOString() });
              setFormVisible(true);
            }}
            style={{ ...baseStyles.miniButton, width: "auto", paddingHorizontal: 16 }}
            icon="plus"
          >
            Agregar
          </Button>
        </View>
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
          activityToView={activityToView}
          activityDateToView={activityDateToView}
          onActivityViewed={handleActivityViewed}
          selectedElderId={selectedElderId}
          onElderChange={setSelectedElderId}
          calendarViewRef={calendarViewRef}
          taskListRef={taskListRef}
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
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
        familyMembers={familyMembers}
        currentUserId={idUser}
        preSelectedElderId={selectedElderId}
      />

      <Portal>
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
              gap: 12,
              flexDirection: "column",
            }}
          >
            <CancelButton onPress={() => setDeleteModalVisible(false)} />
            <Button
              onPress={handleDelete}
              mode="contained"
              buttonColor={COLORS.primary}
              style={{ borderRadius: 12, width: "100%" }}
              loading={deleteActivity.isPending}
              disabled={deleteActivity.isPending}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

export default function CalendarScreen() {
  return <CalendarScreenContent />;
}

