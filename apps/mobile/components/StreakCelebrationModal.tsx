import { Modal, View, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { COLORS, FONT } from "@/styles/base";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";

type Props = {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
};

export default function StreakCelebrationModal({
  visible,
  streakCount,
  onClose,
}: Props) {
  // Valores animados
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const fireScale = useSharedValue(1);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset valores
      scale.value = 0;
      rotation.value = 0;
      opacity.value = 0;
      fireScale.value = 1;
      confettiOpacity.value = 0;

      // Iniciar animaciones
      // Fade in del fondo
      opacity.value = withTiming(1, { duration: 300 });

      // Entrada del emoji con bounce
      scale.value = withSequence(
        withSpring(1.3, { damping: 3, stiffness: 100 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );

      // Rotación suave
      rotation.value = withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );

      // Pulso del fuego
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinito
        true
      );

      // Confetti fade in con delay
      confettiOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 400 })
      );
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * fireScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
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
        
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={["#7C3AED", "#A855F7", "#C084FC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Confetti decorativo */}
            <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
              <Text style={styles.confetti}>✨</Text>
              <Text style={[styles.confetti, styles.confettiTopRight]}>🎉</Text>
              <Text style={[styles.confetti, styles.confettiBottomLeft]}>⭐</Text>
              <Text style={[styles.confetti, styles.confettiBottomRight]}>💫</Text>
            </Animated.View>

            {/* Emoji de fuego animado */}
            <Animated.Text style={[styles.fireEmoji, fireAnimatedStyle]}>
              🔥
            </Animated.Text>

            {/* Textos */}
            <Text style={styles.title}>¡Racha extendida!</Text>
            <Text style={styles.streakText}>
              {streakCount} {streakCount === 1 ? "día" : "días"}
            </Text>
            <Text style={styles.subtitle}>
              {streakCount === 1
                ? "¡Buen comienzo! Sigue así"
                : streakCount < 7
                ? "¡Vas muy bien!"
                : streakCount < 30
                ? "¡Increíble constancia!"
                : "¡Eres una leyenda! 🏆"}
            </Text>

            {/* Botón de cerrar */}
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Continuar</Text>
            </Pressable>
          </LinearGradient>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    width: "85%",
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    fontSize: 40,
    position: "absolute",
    top: 20,
    left: 20,
  },
  confettiTopRight: {
    top: 30,
    left: undefined,
    right: 30,
  },
  confettiBottomLeft: {
    top: undefined,
    bottom: 80,
    left: 25,
  },
  confettiBottomRight: {
    top: undefined,
    bottom: 90,
    left: undefined,
    right: 25,
  },
  fireEmoji: {
    fontSize: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "center",
  },
  streakText: {
    fontSize: 48,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: COLORS.white,
  },
});
