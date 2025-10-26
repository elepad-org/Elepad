import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { MemoryCard } from "./MemoryCard";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import { COLORS } from "@/styles/base";

interface MemoryGameBoardProps {
  onQuit: () => void;
  onComplete: (stats: { moves: number; timeElapsed: number }) => void;
}

export const MemoryGameBoard: React.FC<MemoryGameBoardProps> = ({
  onQuit,
  onComplete,
}) => {
  const { cards, flipCard, resetGame, stats, isProcessing } = useMemoryGame();
  const hasCalledOnComplete = React.useRef(false);

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cuando se completa el juego, notificar al padre (solo una vez)
  React.useEffect(() => {
    if (stats.isComplete && !hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;
      onComplete({
        moves: stats.moves,
        timeElapsed: stats.timeElapsed,
      });
    }
  }, [stats.isComplete, stats.moves, stats.timeElapsed, onComplete]);

  // Resetear el flag cuando se reinicia el juego
  React.useEffect(() => {
    if (!stats.isComplete) {
      hasCalledOnComplete.current = false;
    }
  }, [stats.isComplete]);

  return (
    <View style={styles.container}>
      {/* Estadísticas */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              ⏱️ Tiempo
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {formatTime(stats.timeElapsed)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              🎯 Movimientos
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {stats.moves}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Tablero de juego */}
      <View style={styles.board}>
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            id={card.id}
            symbol={card.symbol}
            state={card.state}
            onPress={() => flipCard(card.id)}
            disabled={isProcessing}
          />
        ))}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <Button
          mode="contained"
          onPress={resetGame}
          icon="refresh"
          style={styles.button}
          buttonColor={COLORS.primary}
        >
          Reiniciar
        </Button>
        <Button
          mode="outlined"
          onPress={onQuit}
          icon="exit-to-app"
          style={styles.button}
          textColor={COLORS.error}
        >
          Abandonar
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
