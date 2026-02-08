import { View, StyleSheet, Image, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBox } from "@/components/shared";
import { useStreakHistory } from "@/hooks/useStreak";
import { useMemo } from "react";

// Obtener ancho de pantalla para hacerlo responsivo
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Imágenes de Elepad según nivel de racha
const ELEPAD_IMAGES = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bronze: require("../assets/images/EleRacha/FrioPared.png"), // 0-2 días
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  silver: require("../assets/images/EleRacha/NormalPared.png"), // 3-29 días
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gold: require("../assets/images/EleRacha/FuegoPared.png"), // 30+ días
};

const DAYS_OF_WEEK = ["D", "L", "Ma", "Mi", "J", "V", "S"];

export default function StreakCounter() {
  const { streak, streakLoading } = useAuth();

  // Helper para formatear fecha local YYYY-MM-DD
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calcular la semana actual (Domingo a Sábado) en hora local
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 (Dom) - 6 (Sab)

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek); // Retroceder al Domingo

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Avanzar al Sábado

  const startDateStr = formatDateLocal(startOfWeek);
  const endDateStr = formatDateLocal(endOfWeek);

  const { data: historyData, isLoading: historyLoading } = useStreakHistory(
    startDateStr,
    endDateStr,
  );

  // Calcular status para cada día de la semana actual (Domingo a Sábado)
  const weekStatus = useMemo(() => {
    if (!historyData?.dates) return Array(7).fill(false);

    const streakDates = new Set(historyData.dates);
    const status: boolean[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateLocal(date);
      status.push(streakDates.has(dateStr));
    }

    return status;
  }, [historyData, startOfWeek]);

  // Factores de escala basados en tu preferencia de 400px
  // 400px es aprox 100% del ancho de un celular promedio, usaremos un factor seguro
  const IMAGE_SIZE_LARGE = SCREEN_WIDTH * 0.95; // 95% del ancho de pantalla
  const IMAGE_SIZE_NORMAL = SCREEN_WIDTH * 0.9;

  // Configuración específica para cada nivel de racha
  const getElepadConfig = (streakCount: number) => {
    // NIVEL ORO (>= 70 días) - Fuego
    if (streakCount >= 10) {
      return {
        source: ELEPAD_IMAGES.gold,
        style: {
          width: IMAGE_SIZE_LARGE,
          height: IMAGE_SIZE_LARGE,
          marginRight: -IMAGE_SIZE_LARGE * 0.18, // Proporcional al tamaño
          marginBottom: -50,
        },
      };
    }
    // NIVEL PLATA (10 - 69 días) - Normal
    if (streakCount >= 10) {
      return {
        source: ELEPAD_IMAGES.silver,
        style: {
          width: IMAGE_SIZE_NORMAL,
          height: IMAGE_SIZE_NORMAL,
          marginRight: -70,
          marginBottom: 0,
        },
      };
    }
    // NIVEL BRONCE (< 10 días) - Frio
    return {
      source: ELEPAD_IMAGES.bronze,
      style: {
        width: IMAGE_SIZE_LARGE,
        height: IMAGE_SIZE_LARGE,
        marginRight: -IMAGE_SIZE_LARGE * 0.2,
        marginBottom: -50,
      },
    };
  };

  if ((streakLoading || historyLoading) && !streak) {
    return (
      <View style={styles.container}>
        <SkeletonBox width="100%" height={160} borderRadius={16} />
      </View>
    );
  }

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
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakIcon}>🔥</Text>
              </View>
              <Text style={styles.streakLabel}>Días de racha</Text>
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
                ...elepadConfig.style, // Aplica los estilos específicos
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
    width: 140,
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-end", // Alinear a la derecha
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
  streakIcon: {
    fontSize: 32,
    marginLeft: 8,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    marginBottom: 8,
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
  checkmark: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "bold",
  },
  elepadImage: {
    resizeMode: "contain",
  },
});
