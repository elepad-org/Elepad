import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import { LinearGradient } from "expo-linear-gradient";
import { useUserStreak } from "@/hooks/useStreak";

export default function StreakCounter() {
  const { data: streak, isLoading } = useUserStreak();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const currentStreak = streak?.currentStreak || 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#FF8C42"]}
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
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
          </View>
        </View>
      </LinearGradient>
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
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
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
