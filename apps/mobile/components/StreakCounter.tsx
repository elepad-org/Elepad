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
  silver: require("../assets/images/EleRacha/Normal.png"), // 3-29 días
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gold: require("../assets/images/EleRacha/FuegoPared.png"), // 30+ días
};

const DAYS_OF_WEEK = ["D", "L", "Ma", "Mi", "J", "V", "S"];

export default function StreakCounter() {
  const { streak, streakLoading } = useAuth();

  // Obtener los últimos 7 días para mostrar el gráfico semanal
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];
  const startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: historyData, isLoading: historyLoading } = useStreakHistory(
    startDate,
    endDate,
  );

  // Calcular qué días de la última semana tienen racha
  const weekStatus = useMemo(() => {
    if (!historyData?.dates) return Array(7).fill(false);

    const streakDates = new Set(historyData.dates);
    const status: boolean[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      status.push(streakDates.has(dateStr));
    }

    return status;
  }, [historyData]);

  // Factores de escala basados en tu preferencia de 400px
  // 400px es aprox 100% del ancho de un celular promedio, usaremos un factor seguro
  const IMAGE_SIZE_LARGE = SCREEN_WIDTH * 0.95; // 95% del ancho de pantalla
  const IMAGE_SIZE_NORMAL = SCREEN_WIDTH * 0.75;

  // Configuración específica para cada nivel de racha
  const getElepadConfig = (streakCount: number) => {
    // NIVEL ORO (>= 70 días) - Fuego
    if (streakCount >= 7) {
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
    if (streakCount >= 1) {
      return {
        source: ELEPAD_IMAGES.silver,
        style: {
          width: IMAGE_SIZE_NORMAL,
          height: IMAGE_SIZE_NORMAL,
          marginRight: -40,
          marginBottom: -40,
        },
      };
    }
    // NIVEL BRONCE (< 10 días) - Frio
    return {
      source: ELEPAD_IMAGES.bronze,
      style: {
        width: IMAGE_SIZE_LARGE,
        height: IMAGE_SIZE_LARGE,
        marginRight: -IMAGE_SIZE_LARGE * 0.15,
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
