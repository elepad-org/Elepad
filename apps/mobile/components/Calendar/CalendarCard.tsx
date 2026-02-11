import React, { useMemo, useState, useEffect, RefObject } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import Animated, { LinearTransition, ZoomIn } from "react-native-reanimated";

import DropdownSelect from "../shared/DropdownSelect";
import ActivityItem from "./ActivityItem";
import ErrorSnackbar from "@/components/shared/ErrorSnackbar";
import { COLORS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { useStreakHistory } from "@/hooks/useStreak";
import { getTodayLocal, toLocalDateString } from "@/lib/dateHelpers";

import {
  Activity,
  useGetFrequencies,
  useGetActivityCompletions,
  usePostActivityCompletionsToggle,
  getActivitiesFamilyCodeIdFamilyGroupResponse,
  GetFamilyGroupIdGroupMembers200,
} from "@elepad/api-client";

// --- Tipos y Constantes ---

type Frequency = {
  id: string;
  label: string;
  rrule: string | null;
};

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
  isOwnerOfGroup: boolean;
  groupInfo?: GetFamilyGroupIdGroupMembers200;
  activityToView?: string | null;
  activityDateToView?: string | null;
  onActivityViewed?: () => void;
  selectedElderId: string | null;
  onElderChange: (elderId: string | null) => void;
  calendarViewRef?: RefObject<View | null>;
  taskListRef?: RefObject<View | null>;
  selectedDay: string;
  onDayChange: (day: string) => void;
}

// Configuración de localización para el calendario (Español)
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
  dayNamesShort: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

// --- Helpers ---

/**
 * Expande una actividad recurrente en una lista de fechas basadas en su regla RRULE.
 * Soporta FREQ=DAILY, WEEKLY, MONTHLY, YEARLY y BYDAY.
 */
function expandRecurringActivity(
  activity: Activity,
  startDate: Date,
  endDate: Date,
  frequencies: Record<string, { label: string; rrule: string | null }>,
): string[] {
  // Si no tiene frecuencia válida, retornar solo fecha de inicio
  if (!activity.frequencyId || !frequencies[activity.frequencyId]) {
    return [toLocalDateString(new Date(activity.startsAt))];
  }

  const frequency = frequencies[activity.frequencyId];
  const rrule = frequency.rrule;

  // Si no hay RRULE ("Una vez"), retornar solo fecha de inicio
  if (!rrule) {
    return [toLocalDateString(new Date(activity.startsAt))];
  }

  const dates: string[] = [];
  const activityStart = new Date(activity.startsAt);
  const activityEnd = activity.endsAt ? new Date(activity.endsAt) : endDate;

  // Parsing básico de RRULE
  let freq: string | null = null;
  let interval = 1;
  let byDay: string[] = [];

  const freqMatch = rrule.match(/FREQ=(\w+)/);
  if (freqMatch) freq = freqMatch[1];

  const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
  if (intervalMatch) interval = parseInt(intervalMatch[1]);

  const byDayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
  if (byDayMatch) byDay = byDayMatch[1].split(",");

  // Generación de fechas
  const currentDate = new Date(activityStart);
  const maxIterations = 365; // Límite de seguridad
  let iterations = 0;

  while (
    currentDate <= activityEnd &&
    currentDate <= endDate &&
    iterations < maxIterations
  ) {
    iterations++;

    let shouldInclude = true;

    // Verificar día de la semana (BYDAY)
    if (byDay.length > 0) {
      const dayOfWeek = currentDate.getDay();
      const dayMap: Record<number, string> = {
        0: "SU",
        1: "MO",
        2: "TU",
        3: "WE",
        4: "TH",
        5: "FR",
        6: "SA",
      };
      shouldInclude = byDay.includes(dayMap[dayOfWeek]);
    }

    if (shouldInclude && currentDate >= activityStart) {
      dates.push(toLocalDateString(currentDate));
    }

    // Avanzar fecha según frecuencia
    switch (freq) {
      case "DAILY":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "WEEKLY":
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case "MONTHLY":
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case "YEARLY":
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        return [toLocalDateString(new Date(activity.startsAt))];
    }
  }

  return dates.length > 0
    ? dates
    : [toLocalDateString(new Date(activity.startsAt))];
}

// Interfaz para las marcas del calendario
interface Marking {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  hasStreak?: boolean;
  streakPosition?: "single" | "start" | "middle" | "end";
  isCurrentStreak?: boolean;
}

interface DayComponentProps {
  date?: DateData;
  state?: string;
  marking?: Marking;
  onPress?: (date: DateData) => void;
}

/**
 * Componente personalizado para renderizar un día en el calendario.
 * Maneja la visualización de selección, puntos de actividad y la racha (streak).
 */
function DayComponent({ date, state, marking, onPress }: DayComponentProps) {
  if (!date) return <View style={styles.emptyDay} />;

  const isDisabled = state === "disabled";
  const isToday = state === "today";
  const isSelected = marking?.selected;
  const hasStreak = marking?.hasStreak;
  const hasDot = marking?.marked;
  const streakPosition = marking?.streakPosition || "single";
  const isCurrentStreak = marking?.isCurrentStreak || false;

  // Calcular si es inicio/fin de semana para estilos de racha
  const [year, month, day] = date.dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  const dayOfWeek = localDate.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // Estilos de fondo para la racha
  const getStreakBackgroundStyle = () => {
    if (!hasStreak) return null;

    const bgColor = isCurrentStreak ? "#ffbf84ff" : "#ffe5ccff";
    const baseStyle = {
      position: "absolute" as const,
      top: 0,
      bottom: 0,
      backgroundColor: bgColor,
    };

    switch (streakPosition) {
      case "single":
        return { ...baseStyle, left: 0, right: 0, borderRadius: 10 };
      case "start":
        return {
          ...baseStyle,
          left: 0,
          right: isSaturday ? 0 : -16,
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
        };
      case "middle":
        return {
          ...baseStyle,
          left: isSunday ? 0 : -16,
          right: isSaturday ? 0 : -16,
          borderRadius: 0,
        };
      case "end":
        return {
          ...baseStyle,
          left: isSunday ? 0 : -16,
          right: 0,
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
        };
    }
  };

  const streakBgStyle = getStreakBackgroundStyle();

  return (
    <View style={styles.dayContainer}>
      {streakBgStyle && <View style={streakBgStyle} />}
      <TouchableOpacity
        onPress={() => onPress?.(date)}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={styles.dayTouchable}
      >
        {isSelected && (
          <Animated.View
            entering={ZoomIn.duration(200)}
            style={styles.selectedIndicator}
          />
        )}
        <Text
          style={[
            styles.dayText,
            isDisabled && styles.disabledText,
            isToday && !isSelected && !hasStreak && styles.todayText,
            isSelected && styles.selectedDayText,
            !isSelected && hasStreak && isCurrentStreak && styles.streakText,
            !isSelected &&
              hasStreak &&
              !isCurrentStreak &&
              styles.streakPastText,
          ]}
        >
          {date.day}
        </Text>
        {hasDot && (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: isSelected
                  ? "#FFFFFF"
                  : marking?.dotColor || COLORS.primary,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

// --- Componente Principal ---

export default function CalendarCard(props: CalendarCardProps) {
  const {
    idUser,
    activitiesQuery,
    onEdit,
    onDelete,
    isOwnerOfGroup,
    groupInfo,
    activityToView,
    activityDateToView,
    onActivityViewed,
    selectedElderId,
    onElderChange,
    calendarViewRef,
    taskListRef,
    selectedDay,
    onDayChange,
  } = props;

  const { userElepad, streak } = useAuth();
  const today = getTodayLocal();

  // Cambiar al día de la actividad cuando se recibe desde notificaciones
  useEffect(() => {
    if (activityDateToView) {
      onDayChange(activityDateToView);
    }
  }, [activityDateToView, onDayChange]); // Agregué onDayChange a dependencias para cumplir linter

  // Lista de miembros preparada para menciones
  const familyMembers = useMemo(() => {
    if (!groupInfo) return [];
    return (
      groupInfo.members?.map((member) => ({
        id: member.id,
        displayName: member.displayName || "Usuario",
        avatarUrl: member.avatarUrl || null,
        activeFrameUrl: member.activeFrameUrl || null,
      })) || []
    );
  }, [groupInfo]);

  // Lista de adultos mayores para filtro
  const elders = useMemo(() => {
    if (!groupInfo) return [];
    const allMembers = [groupInfo.owner, ...(groupInfo.members || [])];
    return allMembers.filter((member) => member?.elder === true);
  }, [groupInfo]);

  // Estado optimista y errores
  const [optimisticCompletions, setOptimisticCompletions] = useState<
    Record<string, boolean>
  >({});

  const [errorSnackbar, setErrorSnackbar] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  // Rango de fechas para cargar datos (3 meses +/-)
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(now.getMonth() - 3);
    const end = new Date(now);
    end.setMonth(now.getMonth() + 3);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    };
  }, []);

  // Queries
  const completionsQuery = useGetActivityCompletions({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const streakHistoryQuery = useStreakHistory(
    userElepad?.elder ? dateRange.startDate : undefined,
    userElepad?.elder ? dateRange.endDate : undefined,
  );

  const toggleCompletionMutation = usePostActivityCompletionsToggle();
  const frequenciesQuery = useGetFrequencies();

  // Procesar eventos
  const events: Activity[] = useMemo(() => {
    if (!activitiesQuery.data) return [];
    if (
      "data" in activitiesQuery.data &&
      Array.isArray(activitiesQuery.data.data)
    ) {
      return activitiesQuery.data.data;
    }
    if (Array.isArray(activitiesQuery.data)) {
      return activitiesQuery.data as Activity[];
    }
    return [];
  }, [activitiesQuery.data]);

  // Mapa de frecuencias
  const frequenciesMap = useMemo(() => {
    const map: Record<string, { label: string; rrule: string | null }> = {};
    if (!frequenciesQuery.data) return map;

    const frequencies: Frequency[] = (() => {
      const data = frequenciesQuery.data as
        | { data?: Frequency[] }
        | Frequency[];
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
      return [];
    })();

    for (const freq of frequencies) {
      map[freq.id] = { label: freq.label, rrule: freq.rrule };
    }
    return map;
  }, [frequenciesQuery.data]);

  // Expandir eventos recurrentes
  const eventsByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    const now = new Date();
    const startRange = new Date(now);
    startRange.setMonth(now.getMonth() - 3);
    const endRange = new Date(now);
    endRange.setMonth(now.getMonth() + 3);

    for (const ev of events) {
      const dates = expandRecurringActivity(
        ev,
        startRange,
        endRange,
        frequenciesMap,
      );
      for (const date of dates) {
        if (!map[date]) map[date] = [];
        map[date].push(ev);
      }
    }
    return map;
  }, [events, frequenciesMap]);

  // Mapa de completaciones (Server + Optimista)
  const completionsByDateMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const completionsData = completionsQuery.data;

    if (
      completionsData &&
      "data" in completionsData &&
      Array.isArray(completionsData.data)
    ) {
      for (const completion of completionsData.data) {
        const key = `${completion.activityId}_${completion.completedDate}`;
        map[key] = true;
      }
    }

    for (const key in optimisticCompletions) {
      map[key] = optimisticCompletions[key];
    }
    return map;
  }, [completionsQuery.data, optimisticCompletions]);

  // Calcular marcas del calendario (Puntos y Racha)
  const marked = useMemo(() => {
    const obj: Record<string, Marking> = {};
    const streakDays = userElepad?.elder
      ? (streakHistoryQuery.data?.dates || []).map(String).sort()
      : [];

    // Marcar días con eventos
    for (const d of Object.keys(eventsByDate)) {
      const eventsOnDay = eventsByDate[d];
      const hasRelevantActivities = selectedElderId
        ? eventsOnDay.some((ev) => ev.assignedTo === selectedElderId)
        : eventsOnDay.length > 0;

      if (hasRelevantActivities) {
        obj[d] = { marked: true, dotColor: COLORS.primary };
      }
    }

    // Si `streak` indica que jugamos hoy
    if (userElepad?.elder && streak?.hasPlayedToday) {
      const todayStr = getTodayLocal();
      if (!streakDays.includes(todayStr)) {
        streakDays.push(todayStr);
      }
    }

    // Asegurar que la última fecha jugada también esté incluida
    if (userElepad?.elder && streak?.lastPlayedDate) {
      if (!streakDays.includes(streak.lastPlayedDate)) {
        streakDays.push(streak.lastPlayedDate);
      }
    }
    streakDays.sort();

    // Lógica de Racha Visual (Solo para Elders)
    if (userElepad?.elder && streakDays.length > 0) {
      const streakSet = new Set(streakDays);
      const sortedStreakDays = [...streakDays].sort();
      const mostRecentDay = sortedStreakDays[sortedStreakDays.length - 1];
      const currentStreakDays = new Set<string>();

      // Identificar días de la racha actual continua
      currentStreakDays.add(mostRecentDay);
      let currentDayIter = mostRecentDay;
      while (true) {
        const [year, month, dayNum] = currentDayIter.split("-").map(Number);
        const prevDate = new Date(year, month - 1, dayNum - 1);
        const prevDayStr = toLocalDateString(prevDate);
        if (streakSet.has(prevDayStr)) {
          currentStreakDays.add(prevDayStr);
          currentDayIter = prevDayStr;
        } else {
          break;
        }
      }

      for (const streakDay of streakDays) {
        const day = streakDay as string;
        const [year, month, dayNum] = day.split("-").map(Number);
        const prevDayStr = toLocalDateString(
          new Date(year, month - 1, dayNum - 1),
        );
        const nextDayStr = toLocalDateString(
          new Date(year, month - 1, dayNum + 1),
        );

        const hasPrev = streakSet.has(prevDayStr);
        const hasNext = streakSet.has(nextDayStr);

        if (!obj[day]) obj[day] = {};

        obj[day].hasStreak = true;
        obj[day].isCurrentStreak = currentStreakDays.has(day);

        if (hasPrev && hasNext) obj[day].streakPosition = "middle";
        else if (hasPrev && !hasNext) obj[day].streakPosition = "end";
        else if (!hasPrev && hasNext) obj[day].streakPosition = "start";
        else obj[day].streakPosition = "single";
      }
    }

    // Marcar día seleccionado
    obj[selectedDay] = obj[selectedDay]
      ? { ...obj[selectedDay], selected: true }
      : { selected: true };

    return obj;
  }, [
    eventsByDate,
    selectedDay,
    streakHistoryQuery.data,
    userElepad,
    selectedElderId,
    streak,
  ]);

  // Filtrar y ordenar eventos del día seleccionado
  const dayEvents = useMemo(() => {
    const eventsToday = eventsByDate[selectedDay] ?? [];
    const filtered = selectedElderId
      ? eventsToday.filter((ev) => ev.assignedTo === selectedElderId)
      : eventsToday;

    const incomplete = filtered.filter(
      (ev) => !completionsByDateMap[`${ev.id}_${selectedDay}`],
    );
    const complete = filtered.filter(
      (ev) => completionsByDateMap[`${ev.id}_${selectedDay}`],
    );

    incomplete.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    complete.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    return [...incomplete, ...complete];
  }, [eventsByDate, selectedDay, selectedElderId, completionsByDateMap]);

  // Manejar toggle de completado
  const handleToggleCompletion = async (activity: Activity) => {
    const key = `${activity.id}_${selectedDay}`;
    const newState = !completionsByDateMap[key];

    // Optimista
    setOptimisticCompletions((prev) => ({ ...prev, [key]: newState }));

    // Reintento con backoff
    const attemptToggle = async (attempt: number): Promise<boolean> => {
      try {
        await toggleCompletionMutation.mutateAsync({
          data: { activityId: activity.id, completedDate: selectedDay },
        });
        return true;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000));
          return attemptToggle(attempt + 1);
        }
        return false;
      }
    };

    const success = await attemptToggle(1);

    if (success) {
      await completionsQuery.refetch();
      setOptimisticCompletions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setOptimisticCompletions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setErrorSnackbar({
        visible: true,
        message: "No se pudo actualizar. Intenta nuevamente.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.calendarWrapper} ref={calendarViewRef}>
          <Calendar
            onDayPress={(d: DateData) => onDayChange(d.dateString)}
            markedDates={marked}
            dayComponent={(dayProps) => (
              <DayComponent
                {...dayProps}
                onPress={(d) => onDayChange(d.dateString)}
              />
            )}
            enableSwipeMonths
            style={styles.calendar}
            theme={{
              backgroundColor: COLORS.background,
              calendarBackground: COLORS.background,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text,
              textDisabledColor: COLORS.textPlaceholder,
              monthTextColor: COLORS.text,
              textMonthFontSize: 20,
              textDayFontSize: 18,
              textDayHeaderFontSize: 14,
              arrowColor: COLORS.primary,
            }}
          />
        </View>

        <View style={styles.controlsRow}>
          <View style={{ flex: 1 }}>
            <DropdownSelect
              label="Filtrar actividades"
              value={selectedElderId || "all"}
              options={[
                { key: "all", label: "Todos", icon: "account-group" },
                ...elders.map((elder) => ({
                  key: elder.id,
                  label: elder.displayName,
                  avatarUrl: elder.avatarUrl || null,
                  frameUrl: elder.activeFrameUrl || null,
                })),
              ]}
              onSelect={(value) =>
                onElderChange(value === "all" ? null : value)
              }
              placeholder="Seleccionar adulto mayor"
              showLabel={false}
            />
          </View>
          <IconButton
            icon="calendar-today"
            size={24}
            mode="contained"
            onPress={() => onDayChange(today)}
            style={styles.todayIconButton}
            containerColor={COLORS.primary}
            iconColor={COLORS.white}
          />
        </View>
      </View>

      <View style={{ flex: 1 }} ref={taskListRef}>
        {dayEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedElderId
                ? `No hay actividades programadas para ${
                    elders.find((e) => e.id === selectedElderId)?.displayName ||
                    "este usuario"
                  } ${selectedDay === today ? "hoy" : "en este día"}.`
                : selectedDay === today
                  ? "No hay eventos para hoy."
                  : "No hay eventos para este día."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={dayEvents}
            keyExtractor={(item) =>
              `${item.id}-${completionsByDateMap[`${item.id}_${selectedDay}`]}`
            }
            renderItem={({ item, index }) => (
              <Animated.View
                key={`${item.id}-${selectedDay}`}
                layout={LinearTransition.duration(400)}
                entering={ZoomIn.delay(index * 50).duration(200)}
              >
                <ActivityItem
                  item={item}
                  idUser={idUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleComplete={() => handleToggleCompletion(item)}
                  isOwnerOfGroup={isOwnerOfGroup}
                  groupInfo={groupInfo}
                  completed={
                    completionsByDateMap[`${item.id}_${selectedDay}`] || false
                  }
                  familyMembers={familyMembers}
                  shouldOpen={activityToView === item.id}
                  onOpened={onActivityViewed}
                  showTargetUser={!selectedElderId}
                />
              </Animated.View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ErrorSnackbar
        visible={errorSnackbar.visible}
        onDismiss={() => setErrorSnackbar({ visible: false, message: "" })}
        message={errorSnackbar.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: 24,
  },
  calendarWrapper: {
    marginTop: 0,
    marginBottom: 16,
    position: "relative",
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
  todayIconButton: {
    margin: 0,
  },
  emptyContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 15,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Estilos del DayComponent
  emptyDay: {
    width: 32,
    height: 32,
  },
  dayContainer: {
    width: 32,
    height: 32,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dayTouchable: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  selectedIndicator: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dayText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "400",
  },
  disabledText: {
    color: COLORS.textPlaceholder,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  streakText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  streakPastText: {
    color: "#D67D00",
    fontWeight: "bold",
  },
  dot: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
