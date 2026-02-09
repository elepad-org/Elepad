import { Modal, View, StyleSheet, Pressable, Image } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT, SHADOWS } from "@/styles/base";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  withDelay,
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
  const numberOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  // Checkmark animations (one for each day)
  const checkmarkScales = Array.from({ length: 7 }, () => useSharedValue(0));

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
      numberOpacity.value = 0;
      cardTranslateY.value = 50;
      checkmarkScales.forEach((scale) => (scale.value = 0));
      confettiValues.forEach((conf) => {
        conf.translateY.value = -50;
        conf.translateX.value = 0;
        conf.rotate.value = 0;
        conf.opacity.value = 0;
      });

      // Fade in del fondo
      opacity.value = withTiming(1, { duration: 300 });

      // Slide up animation for the card
      cardTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      // Fade in the streak number
      numberOpacity.value = withTiming(1, { duration: 600 });

      // Animate checkmarks with staggered delays for completed days
      weekStatus.forEach((completed, index) => {
        if (completed) {
          checkmarkScales[index].value = withDelay(
            400 + index * 100,
            withSpring(1, { damping: 8, stiffness: 200 }),
          );
        }
      });

      // Animate confetti infinitely
      confettiValues.forEach((conf, index) => {
        const delay = index * 200;
        const randomX = (Math.random() - 0.5) * 120;
        const randomRotation = Math.random() * 360 - 180;
        const duration = 3000 + Math.random() * 1000;

        setTimeout(() => {
          conf.opacity.value = 1;
          // Infinite loop: fall down, then reset and repeat
          conf.translateY.value = withRepeat(
            withTiming(350, { duration }),
            -1,
            false,
          );
          conf.translateX.value = withRepeat(
            withTiming(randomX, { duration }),
            -1,
            false,
          );
          conf.rotate.value = withRepeat(
            withTiming(randomRotation, { duration }),
            -1,
            false,
          );
        }, delay);
      });
    }
  }, [visible, opacity, confettiValues]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const numberAnimatedStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
  }));

  // Create animated styles for all 7 checkmarks
  const checkmark0 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[0].value }],
  }));
  const checkmark1 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[1].value }],
  }));
  const checkmark2 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[2].value }],
  }));
  const checkmark3 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[3].value }],
  }));
  const checkmark4 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[4].value }],
  }));
  const checkmark5 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[5].value }],
  }));
  const checkmark6 = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScales[6].value }],
  }));

  const checkmarkStyles = [
    checkmark0,
    checkmark1,
    checkmark2,
    checkmark3,
    checkmark4,
    checkmark5,
    checkmark6,
  ];

  // Create animated styles for all 12 confetti particles (must be outside of map)
  const confetti0 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[0].translateY.value },
      { translateX: confettiValues[0].translateX.value },
      { rotate: `${confettiValues[0].rotate.value}deg` },
    ],
    opacity: confettiValues[0].opacity.value,
  }));
  const confetti1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[1].translateY.value },
      { translateX: confettiValues[1].translateX.value },
      { rotate: `${confettiValues[1].rotate.value}deg` },
    ],
    opacity: confettiValues[1].opacity.value,
  }));
  const confetti2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[2].translateY.value },
      { translateX: confettiValues[2].translateX.value },
      { rotate: `${confettiValues[2].rotate.value}deg` },
    ],
    opacity: confettiValues[2].opacity.value,
  }));
  const confetti3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[3].translateY.value },
      { translateX: confettiValues[3].translateX.value },
      { rotate: `${confettiValues[3].rotate.value}deg` },
    ],
    opacity: confettiValues[3].opacity.value,
  }));
  const confetti4 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[4].translateY.value },
      { translateX: confettiValues[4].translateX.value },
      { rotate: `${confettiValues[4].rotate.value}deg` },
    ],
    opacity: confettiValues[4].opacity.value,
  }));
  const confetti5 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[5].translateY.value },
      { translateX: confettiValues[5].translateX.value },
      { rotate: `${confettiValues[5].rotate.value}deg` },
    ],
    opacity: confettiValues[5].opacity.value,
  }));
  const confetti6 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[6].translateY.value },
      { translateX: confettiValues[6].translateX.value },
      { rotate: `${confettiValues[6].rotate.value}deg` },
    ],
    opacity: confettiValues[6].opacity.value,
  }));
  const confetti7 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[7].translateY.value },
      { translateX: confettiValues[7].translateX.value },
      { rotate: `${confettiValues[7].rotate.value}deg` },
    ],
    opacity: confettiValues[7].opacity.value,
  }));
  const confetti8 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[8].translateY.value },
      { translateX: confettiValues[8].translateX.value },
      { rotate: `${confettiValues[8].rotate.value}deg` },
    ],
    opacity: confettiValues[8].opacity.value,
  }));
  const confetti9 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[9].translateY.value },
      { translateX: confettiValues[9].translateX.value },
      { rotate: `${confettiValues[9].rotate.value}deg` },
    ],
    opacity: confettiValues[9].opacity.value,
  }));
  const confetti10 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[10].translateY.value },
      { translateX: confettiValues[10].translateX.value },
      { rotate: `${confettiValues[10].rotate.value}deg` },
    ],
    opacity: confettiValues[10].opacity.value,
  }));
  const confetti11 = useAnimatedStyle(() => ({
    transform: [
      { translateY: confettiValues[11].translateY.value },
      { translateX: confettiValues[11].translateX.value },
      { rotate: `${confettiValues[11].rotate.value}deg` },
    ],
    opacity: confettiValues[11].opacity.value,
  }));

  const confettiStyles = [
    confetti0,
    confetti1,
    confetti2,
    confetti3,
    confetti4,
    confetti5,
    confetti6,
    confetti7,
    confetti8,
    confetti9,
    confetti10,
    confetti11,
  ];

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

        <View style={styles.contentContainer}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            {/* Imagen de fondo grande */}
            <Image
              source={nuevoDiaRachaImage}
              style={styles.backgroundImage}
              resizeMode="contain"
            />

            {/* Confetti particles */}
            {confettiValues.map((conf, index) => {
              const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
              const size = 4 + (index % 3); // Smaller particles: 4, 5, 6px

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.confettiParticle,
                    confettiStyles[index],
                    {
                      backgroundColor: color,
                      width: size,
                      height: size,
                      left: `${5 + index * 8}%`,
                    },
                  ]}
                />
              );
            })}

            {/* Contenido en primer plano */}
            <View style={styles.contentWrapper}>
              <View>
                <Text style={styles.title}>¡Racha extendida!</Text>

                <View style={styles.streakInfo}>
                  <Animated.Text
                    style={[styles.streakNumber, numberAnimatedStyle]}
                  >
                    {streakCount}
                  </Animated.Text>
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
                          <Animated.Text
                            style={[styles.checkmark, checkmarkStyles[index]]}
                          >
                            ✓
                          </Animated.Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
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
