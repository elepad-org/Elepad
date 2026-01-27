import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBox } from "@/components/shared";
import { TourGuideZone } from "rn-tourguide";

export default function StreakCounter() {
  const { streak, streakLoading } = useAuth();



  // Solo mostrar skeleton si está cargando Y no hay datos
  if (streakLoading && !streak) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonText}>
              <SkeletonBox width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBox width="80%" height={13} borderRadius={4} />
            </View>
            <SkeletonBox width={80} height={44} borderRadius={20} />
          </View>
        </View>
      </View>
    );
  }

  // Si no hay racha y no está cargando, no mostrar nada (o manejar error)
  if (!streak) return null;

  const currentStreak = streak.currentStreak;
  const hasPlayedToday = streak.hasPlayedToday;

  return (
    <View style={styles.container}>
      <TourGuideZone
        zone={5}
        text="Aquí puedes ver tu racha actual. ¡Mantén tu progreso jugando a diario!"
        borderRadius={16}
      >
        <LinearGradient
          colors={["#7C3AED", "#A855F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>¡Mantén tu racha!</Text>
              <Text style={styles.subtitle}>Juega al menos una vez al día</Text>
            </View>
            <View style={styles.streakContainer}>
              <Text style={styles.fireEmoji}>{hasPlayedToday ? "🔥" : "🧊"}</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
          </View>
        </LinearGradient>
      </TourGuideZone>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  loadingContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  skeletonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonText: {
    flex: 1,
    marginRight: 16,
  },
  gradient: {
    width: "100%",
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: "rgba(255, 255, 255, 0.9)",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: "center",
  },
  fireEmoji: {
    fontSize: 28,
    marginRight: 6,
  },
  streakNumber: {
    fontSize: 28,
    fontFamily: FONT.bold,
    color: COLORS.white,
  },
});
