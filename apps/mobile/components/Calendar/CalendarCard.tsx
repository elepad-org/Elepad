import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, SegmentedButtons, IconButton } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import { Activity } from "@elepad/api-client";
import { COLORS } from "@/styles/base";
import type { getActivitiesFamilyCodeIdFamilyGroupResponse } from "@elepad/api-client";
import ActivityItem from "./ActivityItem";

import type { GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";

interface CalendarCardProps {
  idFamilyGroup: string;
  idUser: string;
  activitiesQuery: {
    data?: getActivitiesFamilyCodeIdFamilyGroupResponse;
    isLoading: boolean;
    error: unknown;
    refetch: () => Promise<unknown>;
  };
  onEdit: (ev: Activity) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (ev: Activity) => void;
  isOwnerOfGroup: boolean;
  groupInfo?: GetFamilyGroupIdGroupMembers200;
}

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
    idUser,
    activitiesQuery,
    onEdit,
    onDelete,
    onToggleComplete,
    isOwnerOfGroup,
    groupInfo,
  } = props;
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const events: Activity[] = useMemo(() => {
    if (!activitiesQuery.data) return [];

    // El tipo de respuesta es { data: Activity[], status: number, headers: Headers }
    if (
      "data" in activitiesQuery.data &&
      Array.isArray(activitiesQuery.data.data)
    ) {
      return activitiesQuery.data.data;
    }

    // Fallback por si acaso
    if (Array.isArray(activitiesQuery.data)) {
      return activitiesQuery.data as Activity[];
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
      <View style={styles.calendarWrapper}>
        <Calendar
          onDayPress={(d: DateData) => setSelectedDay(d.dateString)}
          markedDates={marked}
          enableSwipeMonths
          style={styles.calendar}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            textSectionTitleColor: "#555",
            selectedDayBackgroundColor: "#8998AF",
            selectedDayTextColor: "#fff",
            todayTextColor: "#8998AF",
            dayTextColor: "#333",
            textDisabledColor: "#ccc",
            monthTextColor: "#4A4A4A",
            textMonthFontSize: 20,
            textDayFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      <View style={styles.controlsRow}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            {
              value: "all",
              label: "Todos",
              style:
                filter === "all"
                  ? styles.segmentedButtonActive
                  : styles.segmentedButtonInactive,
              labelStyle:
                filter === "all"
                  ? styles.segmentedLabelActive
                  : styles.segmentedLabelInactive,
            },
            {
              value: "mine",
              label: "Mis eventos",
              style:
                filter === "mine"
                  ? styles.segmentedButtonActive
                  : styles.segmentedButtonInactive,
              labelStyle:
                filter === "mine"
                  ? styles.segmentedLabelActive
                  : styles.segmentedLabelInactive,
            },
          ]}
          style={styles.segmentedButtons}
        />
        <IconButton
          icon="calendar-today"
          size={24}
          mode="contained"
          onPress={() => {
            setSelectedDay(today);
          }}
          style={styles.todayIconButton}
          containerColor="#8998AF"
          iconColor="#fff"
        />
      </View>

      {activitiesQuery.isLoading && <Text>Cargando...</Text>}
      {!!activitiesQuery.error && (
        <Text style={{ color: "red" }}>
          {activitiesQuery.error instanceof Error
            ? activitiesQuery.error.message
            : String(activitiesQuery.error)}
        </Text>
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
            <ActivityItem
              item={item}
              idUser={idUser}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              isOwnerOfGroup={isOwnerOfGroup}
              groupInfo={groupInfo}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  calendarWrapper: {
    position: "relative",
    marginTop: 16,
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 16,
    elevation: 2,
    padding: 8,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  segmentedButtons: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 24,
    borderWidth: 0,
  },
  segmentedButtonActive: {
    backgroundColor: "rgba(137, 152, 175, 0.75)",
    borderRadius: 20,
    borderWidth: 0,
  },
  segmentedButtonInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 20,
    borderWidth: 0,
  },
  segmentedLabelActive: {
    color: "#ffffff",
  },
  segmentedLabelInactive: {
    color: "rgba(137, 152, 175, 0.8)",
  },
  todayIconButton: {
    margin: 0,
  },
  cardEmpty: {
    marginTop: 20,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    elevation: 1,
  },
});
