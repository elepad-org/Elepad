import React, { useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

export type CardState = "hidden" | "visible" | "matched";

interface MemoryCardProps {
  id: number;
  symbol: string;
  state: CardState;
  onPress: () => void;
  disabled: boolean;
  mode: "4x4" | "4x6";
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  symbol,
  state,
  onPress,
  disabled,
  mode,
}) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // Calcular dimensiones según el modo
  const cardStyles = getCardStyles(mode);

  useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: state === "hidden" ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state, flipAnimation]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const isFlipped = state !== "hidden";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || state !== "hidden"}
      style={[styles.cardContainer, cardStyles.container]}
      activeOpacity={0.7}
    >
      {/* Cara trasera (oculta) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          frontAnimatedStyle,
          isFlipped && styles.hidden,
        ]}
      >
        <Text style={[styles.cardBackText, cardStyles.text]}>?</Text>
      </Animated.View>

      {/* Cara delantera (símbolo) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          state === "matched" && styles.cardMatched,
          backAnimatedStyle,
          !isFlipped && styles.hidden,
        ]}
      >
        <Text style={[styles.symbol, cardStyles.text]}>{symbol}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Función para calcular estilos dinámicos según el modo
const getCardStyles = (mode: "4x4" | "4x6") => {
  if (mode === "4x4") {
    // Para 4x4: cartas más grandes
    return {
      container: {
        width: "23%" as const,
        aspectRatio: 0.85,
        marginBottom: 8,
        marginHorizontal: 2,
      },
      text: {
        fontSize: 40,
      },
    };
  } else {
    // Para 4x6: cartas más pequeñas (originales)
    return {
      container: {
        width: "15.5%" as const,
        aspectRatio: 0.7,
        marginBottom: 6,
        marginHorizontal: 1,
      },
      text: {
        fontSize: 32,
      },
    };
  }
};

const styles = StyleSheet.create({
  cardContainer: {
    // Estilos base - se sobrescriben con estilos dinámicos
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardBack: {
    backgroundColor: COLORS.primary,
  },
  cardFront: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  cardMatched: {
    backgroundColor: "#E8F5E9", // Verde muy claro sólido en lugar de transparente
    borderColor: COLORS.success,
  },
  cardBackText: {
    fontWeight: "bold",
    color: COLORS.white,
  },
  symbol: {
    // fontSize se define dinámicamente
  },
  hidden: {
    opacity: 0,
  },
});
