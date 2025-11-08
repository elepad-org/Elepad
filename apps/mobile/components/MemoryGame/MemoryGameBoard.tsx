import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, ActivityIndicator } from "react-native-paper";
import { MemoryCard } from "./MemoryCard";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import { COLORS } from "@/styles/base";

interface MemoryGameBoardProps {
  onQuit: () => void;
  onComplete: (stats: {
    moves: number;
    timeElapsed: number;
    achievements: Array<{
      id: string;
      title: string;
      icon?: string;
      description?: string;
    }>;
  }) => void;
  onAchievementUnlocked?: (achievement: {
    id: string;
    title: string;
    icon?: string;
    description?: string;
  }) => void;
}

export const MemoryGameBoard: React.FC<MemoryGameBoardProps> = ({
  onQuit,
  onComplete,
  onAchievementUnlocked,
}) => {
  const {
    cards,
    flipCard,
    resetGame,
    stats,
    isProcessing,
    unlockedAchievements,
    isLoading,
  } = useMemoryGame({
    onAchievementUnlocked,
  });
  const hasCalledOnComplete = React.useRef(false);
  const isCheckingAchievements = React.useRef(false);

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cuando el juego se completa, marcar que estamos verificando logros
  React.useEffect(() => {
    if (stats.isComplete && !hasCalledOnComplete.current) {
      isCheckingAchievements.current = true;
      console.log("🎮 Juego completado, esperando verificación de logros...");
    }
  }, [stats.isComplete]);

  // Cuando se completa el juego Y se han verificado los logros, notificar al padre (solo una vez)
  React.useEffect(() => {
    if (
      stats.isComplete &&
      isCheckingAchievements.current &&
      !hasCalledOnComplete.current
    ) {
      // Esperar un poco para dar tiempo a que los logros se procesen
      const timer = setTimeout(() => {
        hasCalledOnComplete.current = true;
        isCheckingAchievements.current = false;
        console.log(
          "🎊 Notificando juego completado con logros:",
          unlockedAchievements,
        );
        onComplete({
          moves: stats.moves,
          timeElapsed: stats.timeElapsed,
          achievements: unlockedAchievements,
        });
      }, 100); // Pequeño delay para asegurar que los logros se hayan actualizado

      return () => clearTimeout(timer);
    }
  }, [
    stats.isComplete,
    stats.moves,
    stats.timeElapsed,
    unlockedAchievements,
    onComplete,
  ]);

  // Resetear el flag cuando se reinicia el juego
  React.useEffect(() => {
    if (!stats.isComplete) {
      hasCalledOnComplete.current = false;
      isCheckingAchievements.current = false;
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Preparando el juego...
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <MemoryCard
              key={card.id}
              id={card.id}
              symbol={card.symbol}
              state={card.state}
              onPress={() => flipCard(card.id)}
              disabled={isProcessing}
            />
          ))
        )}
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
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
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
