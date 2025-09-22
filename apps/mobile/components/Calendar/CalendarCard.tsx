import { useMemo, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, List, Button, SegmentedButtons } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";

interface CalendarCardProps {
  idFamilyGroup: string;
  idUser: string;
  activitiesQuery: any;
  onEdit: (ev: Activity) => void;
  onDelete: (id: string) => void;
  setFormVisible: (v: boolean) => void;
}
import { Activity } from "@elepad/api-client";
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

export default function CalendarCard(props: CalendarCardProps) {
  const {
    idFamilyGroup,
    idUser,
    activitiesQuery,
    onEdit,
    onDelete,
    setFormVisible,
  } = props;
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const events: Activity[] = useMemo(() => {
    if (!activitiesQuery.data) return [];
    if (Array.isArray(activitiesQuery.data)) {
      return activitiesQuery.data as Activity[];
    }
    if ((activitiesQuery.data as unknown as { data?: Activity }).data) {
      return [(activitiesQuery.data as unknown as { data: Activity }).data];
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
    const obj: Record<
      string,
      { marked?: boolean; dotColor?: string; selected?: boolean }
    > = {};
    for (const d of Object.keys(eventsByDate)) {
      obj[d] = { marked: true, dotColor: "#FF8C00" };
    }
    obj[selectedDay] = obj[selectedDay]
      ? { ...obj[selectedDay], selected: true }
      : { selected: true };
    return obj;
  }, [eventsByDate, selectedDay]);

  // Only user's activities only
  const dayEvents = useMemo(() => {
    const eventsToday = eventsByDate[selectedDay] ?? [];
    if (filter === "mine") {
      return eventsToday.filter((ev) => ev.createdBy === idUser);
    }
    return eventsToday;
  }, [eventsByDate, selectedDay, filter, idUser]);

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
            setSelectedDay(today);
          }}
        >
          Hoy
        </Button>
        <Button
          onPress={() => {
            setFormVisible(true);
          }}
        >
          Nuevo
        </Button>
      </View>

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
            <Card
              style={[
                styles.card,
                item.completed && { backgroundColor: "#d4edda" },
              ]}
            >
              <List.Item
                titleStyle={
                  item.completed && { textDecorationLine: "line-through" }
                }
                title={item.title}
                description={`${item.startsAt.slice(11, 16)} - ${
                  item.endsAt ? item.endsAt.slice(11, 16) : ""
                }`}
                right={() =>
                  item.createdBy === idUser ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Button compact onPress={() => onEdit(item)}>
                        Editar
                      </Button>
                      <Button compact onPress={() => onDelete(item.id)}>
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
