import React, { useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ImageStyle,
  ImageSourcePropType,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { useStreakHistory } from "@/hooks/useStreak";
import { SkeletonBox } from "@/components/shared";
import { COLORS, FONT, SHADOWS } from "@/styles/base";

/**
 * Ancho de la pantalla para cálculos responsivos
 */
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Imágenes de la mascota Elepad según el nivel de racha
 */
const ELEPAD_IMAGES = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bronze: require("../assets/images/EleRacha/FrioPared.png"), // 0-2 días
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  silver: require("../assets/images/EleRacha/NormalPared.png"), // 3-29 días
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gold: require("../assets/images/EleRacha/FuegoPared.png"), // 30+ días
};

/**
 * Etiquetas de los días de la semana
 */
const DAYS_OF_WEEK = ["D", "L", "Ma", "Mi", "J", "V", "S"];

// Factores de escala para responsividad
const IMAGE_SIZE_LARGE = SCREEN_WIDTH * 0.95; // 95% del ancho de pantalla
const IMAGE_SIZE_NORMAL = SCREEN_WIDTH * 0.9;

/**
 * Retorna la configuración de imagen y estilo según la racha actual.
 * @param streakCount Número de días de racha
 */
const getElepadConfig = (
  streakCount: number,
): { source: ImageSourcePropType; style: ImageStyle } => {
  // NIVEL ORO (>= 7 días) - Fuego
  if (streakCount >= 7) {
    return {
      source: ELEPAD_IMAGES.gold,
      style: {
        width: IMAGE_SIZE_LARGE,
        height: IMAGE_SIZE_LARGE,
        marginRight: -IMAGE_SIZE_LARGE * 0.2,
        marginBottom: -50,
      } as ImageStyle,
    };
  }
  // NIVEL PLATA (1 - 6 días) - Normal
  if (streakCount >= 1) {
    return {
      source: ELEPAD_IMAGES.silver,
      style: {
        width: IMAGE_SIZE_NORMAL,
        height: IMAGE_SIZE_NORMAL,
        marginRight: -70,
        marginBottom: 0,
      } as ImageStyle,
    };
  }
  // NIVEL BRONCE (< 1 día) - Frio
  return {
    source: ELEPAD_IMAGES.bronze,
    style: {
      width: IMAGE_SIZE_LARGE,
      height: IMAGE_SIZE_LARGE,
      marginRight: -IMAGE_SIZE_LARGE * 0.2,
      marginBottom: -50,
    } as ImageStyle,
  };
};

/**
 * Formatea una fecha a string local YYYY-MM-DD
 */
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Componente que muestra el contador de racha semanal del usuario.
 * Incluye visualización de la mascota, racha actual y días de la semana activos.
 * Se actualiza automáticamente al enfocar la pantalla.
 */
export default function StreakCounter() {
  const { streak, streakLoading, syncStreak } = useAuth();

  // Calcular la semana actual (Domingo a Sábado) en hora local
  const { startDateStr, endDateStr, startOfWeek } = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Dom) - 6 (Sab)

    const start = new Date(today);
    start.setDate(today.getDate() - currentDayOfWeek); // Retroceder al Domingo

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Avanzar al Sábado

    return {
      startOfWeek: start,
      startDateStr: formatDateLocal(start),
      endDateStr: formatDateLocal(end),
    };
  }, []); // Solo se calcula al montar, la fecha 'today' es la del momento de carga

  // Hook para obtener el historial de racha
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useStreakHistory(startDateStr, endDateStr);

  // Refs para evitar ciclo infinito en useFocusEffect
  const syncStreakRef = useRef(syncStreak);
  const refetchHistoryRef = useRef(refetchHistory);

  // Mantener refs actualizadas en cada render
  syncStreakRef.current = syncStreak;
  refetchHistoryRef.current = refetchHistory;

  // Refrescar datos SOLO al enfocar la pantalla (sin dependencias que causen loop)
  useFocusEffect(
    useCallback(() => {
      if (syncStreakRef.current) syncStreakRef.current();
      if (refetchHistoryRef.current) refetchHistoryRef.current();
    }, []),
  );

  // Calcular status para cada día de la semana actual (Domingo a Sábado)
  const weekStatus = useMemo(() => {
    if (!historyData?.dates) return Array(7).fill(false);

    const streakDates = new Set(historyData.dates);

    // Si `streak` indica que jugamos hoy, asegurarnos de que el día de hoy esté marcado
    if (streak?.hasPlayedToday) {
      streakDates.add(formatDateLocal(new Date()));
    }

    // Asegurar que la última fecha jugada también esté marcada (para consistencia)
    if (streak?.lastPlayedDate) {
      streakDates.add(streak.lastPlayedDate);
    }

    const status: boolean[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateLocal(date);
      status.push(streakDates.has(dateStr));
    }

    return status;
  }, [historyData, startOfWeek]);

  // Loading state con Skeleton detallado
  if ((streakLoading || historyLoading) && !streak) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.contentRow}>
            {/* Skeleton Columna Izquierda */}
            <View style={styles.infoColumn}>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <SkeletonBox width={80} height={60} borderRadius={8} />
                </View>
                <View style={{ marginTop: 8 }}>
                  <SkeletonBox width={120} height={16} borderRadius={4} />
                </View>
              </View>

              {/* Skeleton Días de la semana */}
              <View style={styles.weekContainer}>
                {Array(7)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={styles.dayWrapper}>
                      <SkeletonBox width={20} height={10} borderRadius={2} />
                      <SkeletonBox width={24} height={24} borderRadius={12} />
                    </View>
                  ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Si no hay datos de racha (ej. usuario no logueado o error), no mostrar nada
  if (!streak) return null;

  const currentStreak = streak.currentStreak;
  const elepadConfig = getElepadConfig(currentStreak);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.contentRow}>
          {/* Columna Izquierda: Info + Días */}
          <View style={styles.infoColumn}>
            <View>
              <View style={styles.streakInfo}>
                <Text
                  style={[
                    styles.streakNumber,
                    !streak.hasPlayedToday && styles.streakNumberCompact,
                  ]}
                >
                  {currentStreak}
                </Text>
                <MaterialCommunityIcons
                  name="fire"
                  size={44}
                  color={streak.hasPlayedToday ? "#F59E0B" : "#A0A0A0"}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text
                style={[
                  styles.streakLabel,
                  !streak.hasPlayedToday && styles.streakLabelCompact,
                ]}
              >
                Días de racha
              </Text>
              {!streak.hasPlayedToday && (
                <Text style={styles.streakWarning}>
                  ¡Completa la racha hoy!
                </Text>
              )}
            </View>

            {/* Días de la semana */}
            <View style={styles.weekContainer}>
              {DAYS_OF_WEEK.map((day, index) => (
                <View key={index} style={styles.dayWrapper}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View
                    style={[
                      styles.dayCircle,
                      weekStatus[index] && styles.dayCircleActive,
                      index === new Date().getDay() &&
                        !streak.hasPlayedToday &&
                        styles.dayCircleTodayIncomplete,
                    ]}
                  >
                    {weekStatus[index] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Columna Derecha: Elepad */}
          <View style={styles.imageColumn}>
            <Image
              source={elepadConfig.source}
              style={{
                resizeMode: "contain",
                ...elepadConfig.style,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  card: {
    borderRadius: 24,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    height: 180, // Altura fija
  },
  contentRow: {
    flexDirection: "row",
    height: "100%",
  },
  infoColumn: {
    flex: 1,
    padding: 24,
    paddingRight: 0,
    justifyContent: "space-between",
    zIndex: 2,
  },
  imageColumn: {
    width: 140, // Ancho base para controlar el layout flex, la imagen usa overflow visible si es necesario
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end", // Alinear imagen a la derecha del contenedor
    zIndex: 1,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 56,
    fontFamily: FONT.bold,
    color: COLORS.text,
    lineHeight: 60,
    letterSpacing: -2,
  },
  streakNumberCompact: {
    fontSize: 48,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  streakLabelCompact: {
    fontSize: 14,
    marginBottom: 4,
  },
  weekContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dayWrapper: {
    alignItems: "center",
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleActive: {
    backgroundColor: "#F59E0B",
  },
  dayCircleTodayIncomplete: {
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  checkmark: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "bold",
  },
  streakWarning: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    marginTop: 0,
    marginBottom: 0,
  },
});
