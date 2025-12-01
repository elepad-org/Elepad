import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { MemoryCard } from "./MemoryCard";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import { GameLoadingView } from "@/components/shared";
import { COLORS } from "@/styles/base";

interface MemoryGameBoardProps {
  mode: "4x4" | "4x6";
  onQuit: () => void;
  onComplete: (stats: {
    moves: number;
    timeElapsed: number;
    achievements: Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string;
    }>;
  }) => void;
  onAchievementUnlocked?: (achievement: {
    id: string;
    title: string;
    icon?: string | null;
    description?: string;
  }) => void;
}

export const MemoryGameBoard: React.FC<MemoryGameBoardProps> = ({
  mode,
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
    gameId,
  } = useMemoryGame({
    mode,
    onAchievementUnlocked,
  });
  const hasCalledOnComplete = React.useRef(false);
  const isCheckingAchievements = React.useRef(false);
  const lastCompletedGameId = React.useRef<string | null>(null);
  const prevGameId = React.useRef<string>(gameId);

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Detectar cuando cambia el gameId INMEDIATAMENTE (antes de cualquier otro effect)
  if (prevGameId.current !== gameId) {
    console.log(
      "🔄 GameId cambió de",
      prevGameId.current,
      "a",
      gameId,
      "- Reseteando flags INMEDIATAMENTE",
    );
    prevGameId.current = gameId;
    hasCalledOnComplete.current = false;
    isCheckingAchievements.current = false;
  }

  // Cuando el juego se completa, marcar que estamos verificando logros
  React.useEffect(() => {
    if (stats.isComplete && !hasCalledOnComplete.current) {
      isCheckingAchievements.current = true;
      console.log(
        "🎮 Juego completado (gameId:",
        gameId,
        "), esperando verificación de logros...",
      );
      console.log("  - Moves:", stats.moves, "Time:", stats.timeElapsed);
      console.log("  - hasCalledOnComplete:", hasCalledOnComplete.current);
      console.log("  - lastCompletedGameId:", lastCompletedGameId.current);
    }
  }, [stats.isComplete, gameId, stats.moves, stats.timeElapsed]);

  // Cuando se completa el juego Y se han verificado los logros, notificar al padre (solo una vez)
  React.useEffect(() => {
    console.log("📊 useEffect completación:", {
      isComplete: stats.isComplete,
      isCheckingAchievements: isCheckingAchievements.current,
      hasCalledOnComplete: hasCalledOnComplete.current,
      gameId,
      lastCompletedGameId: lastCompletedGameId.current,
      moves: stats.moves,
      time: stats.timeElapsed,
    });

    if (
      stats.isComplete &&
      isCheckingAchievements.current &&
      !hasCalledOnComplete.current
    ) {
      // Verificar que no sea el mismo juego completado anteriormente usando el gameId
      if (lastCompletedGameId.current === gameId) {
        console.log("⚠️ Ignorando completion duplicado del juego:", gameId);
        return;
      }

      // Esperar un poco para dar tiempo a que los logros se procesen
      const timer = setTimeout(() => {
        hasCalledOnComplete.current = true;
        isCheckingAchievements.current = false;
        lastCompletedGameId.current = gameId;
        console.log(
          "🎊 Notificando juego completado (gameId:",
          gameId,
          ") con logros:",
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
    gameId,
  ]);

  // Resetear el flag cuando se reinicia el juego o cambia el gameId
  React.useEffect(() => {
    if (!stats.isComplete) {
      hasCalledOnComplete.current = false;
      isCheckingAchievements.current = false;
    }
  }, [stats.isComplete]);

  // Mostrar loading a pantalla completa (igual que NET)
  if (isLoading) {
    return <GameLoadingView message="Preparando el juego..." />;
  }

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {cards.map((card) => (
              <MemoryCard
                key={card.id}
                id={card.id}
                symbol={card.symbol}
                state={card.state}
                onPress={() => flipCard(card.id)}
                disabled={isProcessing}
                mode={mode}
              />
            ))}
          </View>
        </View>
      </ScrollView>

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
  },
  statsCard: {
    marginBottom: 12,
    marginHorizontal: 16,
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
    fontSize: 13,
  },
  statValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
  },
  boardContainer: {
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    minHeight: 400,
    width: "100%",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
  },
});
