import { Modal, View, StyleSheet, Pressable, Image } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useMemo } from "react";

type Props = {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
};

const DAYS_OF_WEEK = ["D", "L", "Ma", "Mi", "J", "V", "S"];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nuevoDiaRachaImage = require("../assets/images/EleRacha/NuevoDiaRacha.png");

const CONFETTI_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
];

export default function StreakCelebrationModal({
  visible,
  streakCount,
  onClose,
}: Props) {
  // Animaciones
  const opacity = useSharedValue(0);

  // Confetti animations (12 particles) - create shared values directly
  const confettiValues = Array.from({ length: 12 }, () => ({
    translateY: useSharedValue(-100),
    translateX: useSharedValue(0),
    rotate: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  // Calcular estado de los días de la semana
  const weekStatus = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const status: boolean[] = [];

    for (let i = 0; i < 7; i++) {
      // Marcar como completado si es hoy o un día anterior de esta semana
      status.push(i <= currentDayOfWeek);
    }

    return status;
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset
      opacity.value = 0;
      confettiValues.forEach((conf) => {
        conf.translateY.value = -100;
        conf.translateX.value = 0;
        conf.rotate.value = 0;
        conf.opacity.value = 0;
      });

      // Fade in del fondo
      opacity.value = withTiming(1, { duration: 300 });

      // Animate confetti
      confettiValues.forEach((conf, index) => {
        const delay = index * 80;
        const randomX = (Math.random() - 0.5) * 300;
        const randomRotation = Math.random() * 720 - 360;
        const duration = 2500 + Math.random() * 500;

        setTimeout(() => {
          conf.opacity.value = withTiming(1, { duration: 200 });
          conf.translateY.value = withTiming(700, { duration });
          conf.translateX.value = withTiming(randomX, { duration });
          conf.rotate.value = withTiming(randomRotation, { duration });
        }, delay);

        // Fade out at the end
        setTimeout(
          () => {
            conf.opacity.value = withTiming(0, { duration: 300 });
          },
          duration + delay - 300,
        );
      });
    }
  }, [visible, opacity, confettiValues]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, containerAnimatedStyle]}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Confetti particles */}
        {confettiValues.map((conf, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [
              { translateY: conf.translateY.value },
              { translateX: conf.translateX.value },
              { rotate: `${conf.rotate.value}deg` },
            ],
            opacity: conf.opacity.value,
          }));

          const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
          const size = 8 + Math.random() * 6;

          return (
            <Animated.View
              key={index}
              style={[
                styles.confettiParticle,
                animatedStyle,
                {
                  backgroundColor: color,
                  width: size,
                  height: size,
                  left: `${10 + index * 7}%`,
                },
              ]}
            />
          );
        })}

        <View style={styles.contentContainer}>
          <View style={styles.card}>
            {/* Imagen de fondo grande */}
            <Image
              source={nuevoDiaRachaImage}
              style={styles.backgroundImage}
              resizeMode="contain"
            />

            {/* Contenido en primer plano */}
            <View style={styles.contentWrapper}>
              <View>
                <Text style={styles.title}>¡Racha extendida!</Text>

                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{streakCount}</Text>
                  <Text style={styles.streakIcon}>🔥</Text>
                </View>
                <Text style={styles.streakLabel}>Días de racha</Text>
              </View>

              {/* Días de la semana */}
              <View style={styles.weekContainer}>
                {DAYS_OF_WEEK.map((day, index) => {
                  return (
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
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiParticle: {
    position: "absolute",
    top: 0,
    borderRadius: 4,
  },
  contentContainer: {
    width: "90%",
    maxWidth: 420,
    zIndex: 1,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    right: -100,
    bottom: -80,
    width: 380,
    height: 380,
  },
  contentWrapper: {
    zIndex: 1,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: FONT.bold,
    color: COLORS.text,
    lineHeight: 52,
    letterSpacing: -2,
  },
  streakIcon: {
    fontSize: 28,
    marginLeft: 8,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: COLORS.textSecondary,
    marginBottom: 16,
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
});
