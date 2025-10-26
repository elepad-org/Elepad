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
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  symbol,
  state,
  onPress,
  disabled,
}) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;

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
      style={styles.cardContainer}
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
        <Text style={styles.cardBackText}>?</Text>
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
        <Text style={styles.symbol}>{symbol}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "15%",
    aspectRatio: 0.7,
    margin: 4,
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
    backgroundColor: COLORS.success + "20",
    borderColor: COLORS.success,
  },
  cardBackText: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
  },
  symbol: {
    fontSize: 32,
  },
  hidden: {
    opacity: 0,
  },
});
