import { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, List, Text, IconButton } from "react-native-paper";
import { FONT } from "@/styles/base";

type EventItem = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  description?: string;
};

/**
 * Mock events
 */
const mockEvents: EventItem[] = [
  { id: "e1", date: "2025-08-21", time: "09:00", title: "Terapia de lenguaje" },
  { id: "e2", date: "2025-08-21", time: "11:00", title: "Juego sensorial" },
  { id: "e3", date: "2025-08-22", time: "14:00", title: "Visita médica" },
  { id: "e4", date: "2025-08-25", time: "10:30", title: "Reunión familiar" },
  { id: "e5", date: "2025-09-02", time: "08:00", title: "Rutina matutina" },
];

const weekDaysShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"];

function getMonthMatrix(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();

  const startWeekday = (firstDay.getDay() + 6) % 7; // 0..6 where 0 = Monday
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const matrix: (number | null)[] = Array.from(
    { length: totalCells },
    (_, i) => {
      const dayNumber = i - startWeekday + 1;
      return dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
    },
  );
  // split into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < matrix.length; i += 7) {
    weeks.push(matrix.slice(i, i + 7));
  }
  return weeks;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export default function CalendarView() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0..11
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const ev of mockEvents) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, []);

  const weeks = useMemo(
    () => getMonthMatrix(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        month: "long",
        year: "numeric",
      }).format(new Date(viewYear, viewMonth, 1)),
    [viewYear, viewMonth],
  );

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const renderDayCell = (day: number | null) => {
    if (!day) {
      return <View style={styles.dayCellEmpty} />;
    }
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    const hasEvents = !!eventsByDate[dateStr];
    const isSelected = selectedDate === dateStr;
    const isToday =
      dateStr ===
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    return (
      <View>
        <TouchableOpacity
          key={dateStr}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isToday && styles.dayCellToday,
          ]}
          onPress={() => setSelectedDate(dateStr)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}
          >
            {day}
          </Text>
          {hasEvents && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    );
  };

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Calendario 4</Text>
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          size={28}
          iconColor="#444"
          onPress={handlePrev}
          style={styles.navBtn}
        />
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <IconButton
          icon="chevron-right"
          size={28}
          iconColor="#444"
          onPress={handleNext}
          style={styles.navBtn}
        />
      </View>

      <View style={styles.weekDays}>
        {weekDaysShort.map((wd) => (
          <Text key={wd} style={styles.weekDayText}>
            {wd}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {weeks.map((week, wi) => (
          <View key={`w-${wi}`} style={styles.weekRow}>
            {week.map((d, di) => (
              <View key={`d-${di}`} style={styles.dayWrapper}>
                {renderDayCell(d)}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.sectionTitle}>Eventos — {selectedDate}</Text>

        {selectedEvents.length === 0 ? (
          <Card style={styles.noEventsCard}>
            <Card.Content>
              <Text style={{ color: "#666" }}>
                {selectedDate ===
                `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
                  ? "No hay eventos para hoy."
                  : "No hay eventos para este día."}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={{ paddingBottom: 8 }}>
            {selectedEvents
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((item, idx) => (
                <View key={item.id}>
                  <List.Item
                    title={item.title}
                    titleStyle={{ color: "#333" }}
                    description={
                      item.description
                        ? `${item.description}`
                        : "No hay detalles de la actividad"
                    }
                    descriptionStyle={{ color: "#666" }}
                    left={() => (
                      <View style={styles.eventTimeContainer}>
                        <Text style={styles.eventTimeText}>{item.time}</Text>
                      </View>
                    )}
                  />
                  {idx < selectedEvents.length - 1 && (
                    <View style={{ height: 8 }} />
                  )}
                </View>
              ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  heading: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginBottom: 8,
    color: "#494949ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: { padding: 6 },
  monthLabel: {
    fontSize: 18,
    fontFamily: FONT.bold,
    textTransform: "capitalize",
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  weekDayText: {
    width: 36,
    textAlign: "center",
    color: "#666",
    fontFamily: FONT.semiBold,
  },
  calendarGrid: {},
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dayWrapper: { width: 36 },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellEmpty: {
    width: 36,
    height: 36,
  },
  dayNumber: { color: "#333" },
  dayCellSelected: { backgroundColor: "#7fb3d3" },
  dayNumberSelected: { color: "#fff", fontFamily: FONT.bold },
  dayCellToday: { borderWidth: 1, borderColor: "#7fb3d3" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF8C00",
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    marginBottom: 6,
    color: "#444",
  },
  noEventsCard: { padding: 8, backgroundColor: "#fff" },
  eventTimeContainer: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTimeText: { fontFamily: FONT.bold, color: "#333" },
});
