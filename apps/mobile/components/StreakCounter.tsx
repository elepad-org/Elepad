import { View, StyleSheet, Image } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBox } from "@/components/shared";
import { useStreakHistory } from "@/hooks/useStreak";
import { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";

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

  // Determinar qué imagen de Elepad mostrar
  const getElepadImage = (streakCount: number) => {
    if (streakCount >= 7) return ELEPAD_IMAGES.gold;
    if (streakCount >= 1) return ELEPAD_IMAGES.silver;
    return ELEPAD_IMAGES.bronze;
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
  const elepadImage = getElepadImage(currentStreak);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Parte Superior: Info + Mascota (Fondo Blanco) */}
        <View style={styles.topSection}>
          <View style={styles.infoContainer}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakIcon}>🔥</Text>
            </View>
            <Text style={styles.streakLabel}>Días de racha</Text>
            <Text style={styles.message}>
              ¡Sigue así! Practica a diario para mantener tu fuego.
            </Text>
          </View>

          <View style={styles.elepadContainer}>
            <Image
              source={elepadImage}
              style={[
                styles.elepadImage,
                // Ajuste especial para imágenes de pared (Bronce < 10, Oro >= 20)
                (currentStreak < 10 || currentStreak >= 20) && {
                  width: 300, // MUCHO más grande
                  height: 300,
                  marginRight: -50, // Pegado agresivamente a la derecha
                  marginTop: 10, // Ajuste vertical si es necesario
                },
              ]}
            />
          </View>
        </View>

        {/* Parte Inferior: Días de la semana (Fondo Gradiente) */}
        <LinearGradient
          colors={["#7C3AED", "#A855F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomSection}
        >
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
                  {weekStatus[index] && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    ...SHADOWS.card,
    backgroundColor: COLORS.white,
  },
  card: {
    borderRadius: 20,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 24, // Padding solo a la izquierda
    paddingTop: 24,
    paddingBottom: 24,
    paddingRight: 0, // Cero padding a la derecha para que la imagen toque el borde
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
    paddingRight: 10, // Un poco de espacio antes de la imagen
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: FONT.bold,
    color: COLORS.text,
    lineHeight: 56,
  },
  streakIcon: {
    fontSize: 32,
    marginLeft: 8,
  },
  streakLabel: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  elepadContainer: {
    width: 120, // Ancho fijo para el contenedor
    height: 120,
    alignItems: "flex-end", // Alinear imagen a la derecha del contenedor
    justifyContent: "center",
  },
  elepadImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  bottomSection: {
    padding: 20,
    paddingTop: 24,
  },
  weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayWrapper: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: "rgba(255, 255, 255, 0.9)",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dayCircleActive: {
    backgroundColor: "#FFA500",
    borderColor: "#FFA500",
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "bold",
  },
});
