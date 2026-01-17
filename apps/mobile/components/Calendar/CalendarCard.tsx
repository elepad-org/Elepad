import { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { Calendar, DateData, LocaleConfig } from "react-native-calendars";
import Animated, { FadeInUp } from "react-native-reanimated";
import DropdownSelect from "../shared/DropdownSelect";
import { Activity, useGetFrequencies } from "@elepad/api-client";
import { COLORS } from "@/styles/base";
import type { getActivitiesFamilyCodeIdFamilyGroupResponse } from "@elepad/api-client";
import ActivityItem from "./ActivityItem";
import {
  useGetActivityCompletions,
  usePostActivityCompletionsToggle,
} from "@elepad/api-client/src/gen/client";
import ErrorSnackbar from "@/components/shared/ErrorSnackbar";
import { useStreakHistory } from "@/hooks/useStreak";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLocal, toLocalDateString } from "@/lib/dateHelpers";

import type { GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";

type Frequency = {
  id: string;
  label: string;
  rrule: string | null;
};

// Función para expandir actividades recurrentes según frequencyId y RRULE
function expandRecurringActivity(
  activity: Activity,
  startDate: Date,
  endDate: Date,
  frequencies: Record<string, { label: string; rrule: string | null }>
): string[] {
  // Si no tiene frecuencia, solo retorna el día de inicio
  if (!activity.frequencyId || !frequencies[activity.frequencyId]) {
    return [toLocalDateString(new Date(activity.startsAt))];
  }

  const frequency = frequencies[activity.frequencyId];
  const rrule = frequency.rrule;

  // Si no hay RRULE (Una vez), solo el día de inicio
  if (!rrule) {
    return [toLocalDateString(new Date(activity.startsAt))];
  }

  const dates: string[] = [];
  const activityStart = new Date(activity.startsAt);
  const activityEnd = activity.endsAt ? new Date(activity.endsAt) : endDate;

  // Parsear el RRULE
  let freq: string | null = null;
  let interval = 1;
  let byDay: string[] = [];

  // Extraer FREQ
  const freqMatch = rrule.match(/FREQ=(\w+)/);
  if (freqMatch) freq = freqMatch[1];

  // Extraer INTERVAL
  const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
  if (intervalMatch) interval = parseInt(intervalMatch[1]);

  // Extraer BYDAY
  const byDayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
  if (byDayMatch) byDay = byDayMatch[1].split(",");

  // Generar fechas según la frecuencia
  let currentDate = new Date(activityStart);

  // Limitar a 365 días para evitar loops infinitos
  const maxIterations = 365;
  let iterations = 0;

  while (
    currentDate <= activityEnd &&
    currentDate <= endDate &&
    iterations < maxIterations
  ) {
    iterations++;

    // Verificar si la fecha actual cumple con las condiciones
    let shouldInclude = true;

    // Si tiene BYDAY, verificar que el día de la semana coincida
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
      const dateStr = toLocalDateString(currentDate);
      dates.push(dateStr);
    }

    // Avanzar según la frecuencia
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
        // Si no hay frecuencia válida, solo agregar el primer día
        return [toLocalDateString(new Date(activity.startsAt))];
    }
  }

  return dates.length > 0
    ? dates
    : [toLocalDateString(new Date(activity.startsAt))];
}

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
    isOwnerOfGroup,
    groupInfo,
    activityToView,
    activityDateToView,
    onActivityViewed,
    selectedElderId,
    onElderChange,
  } = props;
  const { userElepad } = useAuth();
  const today = getTodayLocal();
  const [selectedDay, setSelectedDay] = useState<string>(today);

  // Cambiar al día de la actividad cuando se recibe desde notificaciones
  useEffect(() => {
    if (activityDateToView) {
      setSelectedDay(activityDateToView);
    }
  }, [activityDateToView]);

  // Preparar lista de miembros de la familia para menciones
  const familyMembers = useMemo(() => {
    if (!groupInfo) return [];
    return (
      groupInfo.members?.map((member) => ({
        id: member.id,
        displayName: member.displayName || "Usuario",
        avatarUrl: member.avatarUrl || null,
      })) || []
    );
  }, [groupInfo]);

  // Preparar lista de adultos mayores para el filtro
  const elders = useMemo(() => {
    if (!groupInfo) return [];
    const allMembers = [groupInfo.owner, ...(groupInfo.members || [])];
    return allMembers.filter((member) => member?.elder === true);
  }, [groupInfo]);

  // Estado optimista local para las completaciones
  const [optimisticCompletions, setOptimisticCompletions] = useState<
    Record<string, boolean>
  >({});

  // Estado para mostrar errores
  const [errorSnackbar, setErrorSnackbar] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  // Calcular rango de fechas para cargar completaciones (3 meses antes y después)
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

  // Cargar completaciones para el rango de fechas
  const completionsQuery = useGetActivityCompletions({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Cargar historial de rachas - Solo si el usuario es elder
  const streakHistoryQuery = useStreakHistory(
    userElepad?.elder ? dateRange.startDate : undefined,
    userElepad?.elder ? dateRange.endDate : undefined
  );

  // Mutation para toggle de completaciones
  const toggleCompletionMutation = usePostActivityCompletionsToggle();

  // Cargar frecuencias para expandir actividades recurrentes
  const frequenciesQuery = useGetFrequencies();

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

  // Crear mapa de frecuencias para acceso rápido
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

  const eventsByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};

    // Calcular rango de fechas para expandir (3 meses antes y 3 meses después)
    const now = new Date();
    const startRange = new Date(now);
    startRange.setMonth(now.getMonth() - 3);
    const endRange = new Date(now);
    endRange.setMonth(now.getMonth() + 3);

    for (const ev of events) {
      // Expandir la actividad según su frecuencia
      const dates = expandRecurringActivity(
        ev,
        startRange,
        endRange,
        frequenciesMap
      );

      // Agregar la actividad a cada fecha expandida
      for (const date of dates) {
        if (!map[date]) map[date] = [];
        map[date].push(ev);
      }
    }
    return map;
  }, [events, frequenciesMap]);

  // Crear mapa de completaciones por activityId + fecha (combina servidor + optimista)
  const completionsByDateMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const completionsData = completionsQuery.data;

    // Verificar que sea la respuesta exitosa con data
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

    // Sobrescribir con cambios optimistas
    for (const key in optimisticCompletions) {
      map[key] = optimisticCompletions[key];
    }

    return map;
  }, [completionsQuery.data, optimisticCompletions]);

  const marked = useMemo(() => {
    const obj: Record<
      string,
      {
        marked?: boolean;
        dotColor?: string;
        selected?: boolean;
        customStyles?: {
          container?: {
            borderColor?: string;
            borderWidth?: number;
            borderRadius?: number;
          };
        };
      }
    > = {};

    // Obtener las fechas del historial de rachas - Solo si es elder
    const streakDays = userElepad?.elder
      ? streakHistoryQuery.data?.dates || []
      : [];

    // Filtrar los días con actividades según el adulto mayor seleccionado
    for (const d of Object.keys(eventsByDate)) {
      const eventsOnDay = eventsByDate[d];
      // Si hay un adulto mayor seleccionado, solo marcar si tiene actividades para él
      const hasRelevantActivities = selectedElderId
        ? eventsOnDay.some((ev) => ev.assignedTo === selectedElderId)
        : eventsOnDay.length > 0;

      if (hasRelevantActivities) {
        obj[d] = { marked: true, dotColor: COLORS.primary };
      }
    }

    // Agregar círculos naranjas para días con racha - Solo para usuarios elder
    if (userElepad?.elder) {
      for (const streakDay of streakDays) {
        const day = streakDay as string;
        if (!obj[day]) {
          obj[day] = {};
        }
        obj[day].customStyles = {
          container: {
            borderColor: "#FF6B35",
            borderWidth: 2,
            borderRadius: 18,
          },
        };
      }
    }

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
  ]);

  // Filtrar actividades por adulto mayor seleccionado, ordenados: primero incompletos, luego completados
  const dayEvents = useMemo(() => {
    const eventsToday = eventsByDate[selectedDay] ?? [];
    // Si hay un adulto mayor seleccionado, filtrar por assignedTo
    const filtered = selectedElderId
      ? eventsToday.filter((ev) => ev.assignedTo === selectedElderId)
      : eventsToday;

    // Separar completados de no completados usando completionsByDateMap
    const incomplete = filtered.filter((ev) => {
      const key = `${ev.id}_${selectedDay}`;
      return !completionsByDateMap[key];
    });
    const complete = filtered.filter((ev) => {
      const key = `${ev.id}_${selectedDay}`;
      return completionsByDateMap[key];
    });

    // Ordenar cada grupo por hora de inicio
    incomplete.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    complete.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    // Retornar incompletos primero, luego completados
    return [...incomplete, ...complete];
  }, [eventsByDate, selectedDay, selectedElderId, completionsByDateMap]);

  // Función para toggle optimista con reintentos
  const handleToggleCompletion = async (activity: Activity) => {
    const key = `${activity.id}_${selectedDay}`;
    const currentState = completionsByDateMap[key] || false;
    const newState = !currentState;

    // 1. Actualización optimista instantánea
    setOptimisticCompletions((prev) => ({
      ...prev,
      [key]: newState,
    }));

    // 2. Función de reintento con backoff
    const attemptToggle = async (attemptNumber: number): Promise<boolean> => {
      try {
        await toggleCompletionMutation.mutateAsync({
          data: {
            activityId: activity.id,
            completedDate: selectedDay,
          },
        });
        return true;
      } catch (error) {
        console.error(`Intento ${attemptNumber} fallido:`, error);

        if (attemptNumber < 2) {
          // Esperar 3 segundos antes del siguiente intento
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return attemptToggle(attemptNumber + 1);
        }

        return false;
      }
    };

    // 3. Ejecutar con reintentos (máximo 2 intentos)
    const success = await attemptToggle(1);

    if (success) {
      // 4. Éxito: refrescar datos del servidor y limpiar estado optimista
      await completionsQuery.refetch();
      setOptimisticCompletions((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      // 5. Fallo después de 2 intentos: revertir al estado original
      console.warn("Toggle falló después de 2 intentos, revirtiendo...");
      setOptimisticCompletions((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      // Mostrar mensaje de error al usuario
      setErrorSnackbar({
        visible: true,
        message: "No se pudo actualizar. Intenta nuevamente.",
      });
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.calendarWrapper}>
          <Calendar
            onDayPress={(d: DateData) => setSelectedDay(d.dateString)}
            markedDates={marked}
            markingType={"custom"}
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
                })),
              ]}
              onSelect={(value) => {
                onElderChange(value === "all" ? null : value);
              }}
              placeholder="Seleccionar adulto mayor"
              showLabel={false}
            />
          </View>
          <IconButton
            icon="calendar-today"
            size={24}
            mode="contained"
            onPress={() => {
              setSelectedDay(today);
            }}
            style={styles.todayIconButton}
            containerColor={COLORS.primary}
            iconColor={COLORS.white}
          />
        </View>
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedElderId
              ? `No hay actividades programadas para ${elders.find((e) => e.id === selectedElderId)?.displayName || "este usuario"} ${selectedDay === today ? "hoy" : "en este día"}.`
              : selectedDay === today
                ? "No hay eventos para hoy."
                : "No hay eventos para este día."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(i) => {
            const key = `${i.id}_${selectedDay}`;
            const completed = completionsByDateMap[key] || false;
            return `${i.id}-${completed}`;
          }}
          renderItem={({ item, index }) => (
            <Animated.View
              key={`${item.id}-${selectedDay}`}
              entering={FadeInUp.delay(index * 100).springify()}
            >
              <ActivityItem
                item={item}
                idUser={idUser}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={() => handleToggleCompletion(item)}
                isOwnerOfGroup={isOwnerOfGroup}
                groupInfo={groupInfo}
                completed={(() => {
                  const key = `${item.id}_${selectedDay}`;
                  return completionsByDateMap[key] || false;
                })()}
                familyMembers={familyMembers}
                shouldOpen={activityToView === item.id}
                onOpened={onActivityViewed}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    paddingHorizontal: 16,
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
  filterIcon: {
    margin: 0,
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
});
