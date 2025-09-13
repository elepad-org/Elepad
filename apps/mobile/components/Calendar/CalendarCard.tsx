import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, List, Button, SegmentedButtons } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import ActivityForm from "./ActivityForm";
import {
  usePostActivities,
  usePatchActivitiesId,
  useDeleteActivitiesId,
  Activity,
  NewActivity,
  UpdateActivity,
  useGetActivitiesFamilyCodeIdFamilyGroup,
} from "@elepad/api-client";
import { COLORS } from "@/styles/base";

// Configuración de calendario en español
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mir", "Jue", "Vie", "Sab"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

export default function CalendarCard({
  idFamilyGroup,
  idUser,
}: {
  idFamilyGroup: string;
  idUser: string;
}) {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  // API hooks
  const activitiesQuery =
    useGetActivitiesFamilyCodeIdFamilyGroup(idFamilyGroup);
  const postActivity = usePostActivities();
  const patchActivity = usePatchActivitiesId();
  const deleteActivity = useDeleteActivitiesId();

  const events: Activity[] = useMemo(() => {
    if (!activitiesQuery.data) return [];
    if (Array.isArray(activitiesQuery.data)) {
      return activitiesQuery.data as Activity[];
    }
    if ((activitiesQuery.data as any).data) {
      return [(activitiesQuery.data as any).data];
    }
    return [];
  }, [activitiesQuery.data]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const ev of events) {
      const day = ev.startsAt.slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(ev);
    }
    return map;
  }, [events]);

  const marked = useMemo(() => {
    const obj: Record<string, any> = {};
    for (const d of Object.keys(eventsByDate)) {
      obj[d] = { marked: true, dotColor: "#FF8C00" };
    }
    obj[selectedDay] = obj[selectedDay]
      ? { ...obj[selectedDay], selected: true }
      : { selected: true };
    return obj;
  }, [eventsByDate, selectedDay]);

  // Filtro de actividades solo del usuario
  const dayEvents = useMemo(() => {
    const eventsToday = eventsByDate[selectedDay] ?? [];
    if (filter === "mine") {
      return eventsToday.filter((ev) => ev.createdBy === idUser);
    }
    return eventsToday;
  }, [eventsByDate, selectedDay, filter, idUser]);

  // Guardar actividad
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

  const handleDelete = async (id: string) => {
    await deleteActivity.mutateAsync({ id });
    await activitiesQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(d: DateData) => setSelectedDay(d.dateString)}
        markedDates={marked}
        enableSwipeMonths
        style={styles.calendar}
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#555",
          selectedDayBackgroundColor: "#82bcfeff",
          selectedDayTextColor: "#fff",
          todayTextColor: "#ff2020ff",
          dayTextColor: "#333",
          textDisabledColor: "#ccc",
          monthTextColor: "#4A4A4A",
          textMonthFontSize: 20,
          textDayFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <View style={styles.headerRow}>
        <Text variant="titleMedium">Eventos — {selectedDay}</Text>
        <Button
          onPress={() => {
            setEditing(null);
            setFormVisible(true);
          }}
        >
          Nuevo
        </Button>
      </View>

      {/* Filtro de actividades */}
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: "all", label: "Todos" },
          { value: "mine", label: "Mis eventos" },
        ]}
        style={{ marginBottom: 10 }}
      />

      {activitiesQuery.isLoading && <Text>Cargando...</Text>}
      {activitiesQuery.error && (
        <Text style={{ color: "red" }}>{String(activitiesQuery.error)}</Text>
      )}
      {dayEvents.length === 0 ? (
        <Card style={styles.cardEmpty}>
          <Card.Content>
            <Text>No hay eventos para este día.</Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={dayEvents.sort((a, b) => a.startsAt.localeCompare(b.startsAt))}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <List.Item
                title={item.title}
                description={`${item.startsAt.slice(11, 16)} - ${item.endsAt ? item.endsAt.slice(11, 16) : ""}`}
                right={() =>
                  item.createdBy === idUser ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Button compact onPress={() => handleEdit(item)}>
                        Editar
                      </Button>
                      <Button compact onPress={() => handleDelete(item.id)}>
                        Borrar
                      </Button>
                    </View>
                  ) : null
                }
              />
            </Card>
          )}
        />
      )}

      <ActivityForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    backgroundColor: COLORS.background,
  },
  calendar: {
    borderRadius: 16,
    elevation: 3,
    marginVertical: 20,
    padding: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: "#fff",
  },
  cardEmpty: {
    marginTop: 20,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    elevation: 1,
  },
});
