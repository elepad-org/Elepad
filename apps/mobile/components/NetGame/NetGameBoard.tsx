import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { NetTile } from "./NetTile";
import { useNetGame } from "@/hooks/useNetGame";
import { GameLoadingView } from "@/components/shared";
import { COLORS } from "@/styles/base";

interface NetGameBoardProps {
  gridSize: number;
  onQuit: () => void;
  onComplete: (
    stats: { moves: number; timeElapsed: number },
    isSolvedAutomatically: boolean,
  ) => void;
  onAchievementUnlocked?: (achievement: {
    id: string;
    title: string;
    icon?: string;
    description?: string;
  }) => void;
}

export const NetGameBoard: React.FC<NetGameBoardProps> = ({
  gridSize,
  onQuit,
  onComplete,
  onAchievementUnlocked,
}) => {
  const {
    tiles,
    rotateTile,
    toggleLock,
    resetGame,
    solveGame,
    stats,
    centerTile,
    isSolvedAutomatically,
    isLoading,
  } = useNetGame({
    gridSize,
    onAchievementUnlocked,
  });

  const hasCalledOnComplete = React.useRef(false);

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cuando el juego se completa, notificar al padre (solo una vez)
  React.useEffect(() => {
    if (stats.isComplete && !hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;
      console.log("🎊 Juego NET completado");
      onComplete(
        {
          moves: stats.moves,
          timeElapsed: stats.timeElapsed,
        },
        isSolvedAutomatically,
      );
    }
  }, [
    stats.isComplete,
    stats.moves,
    stats.timeElapsed,
    onComplete,
    isSolvedAutomatically,
  ]);

  // Resetear el flag cuando se reinicia el juego
  React.useEffect(() => {
    if (!stats.isComplete) {
      hasCalledOnComplete.current = false;
    }
  }, [stats.isComplete]);

  // Mostrar indicador de carga
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
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              🔗 Conectadas
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {stats.connectedTiles}/{stats.totalTiles}
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
            {tiles.map((tile) => (
              <NetTile
                key={tile.id}
                id={tile.id}
                type={tile.type}
                rotation={tile.rotation}
                isLocked={tile.isLocked}
                isConnected={tile.isConnected}
                onRotate={(direction) => rotateTile(tile.id, direction)}
                onToggleLock={() => toggleLock(tile.id)}
                disabled={stats.isComplete}
                isCenter={tile.id === centerTile}
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
          mode="contained-tonal"
          onPress={solveGame}
          icon="auto-fix"
          style={styles.button}
          disabled={stats.isComplete}
        >
          Resolver juego
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
    width: "100%",
    paddingHorizontal: 16,
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 8,
    width: "100%",
    aspectRatio: 1, // Mantiene el tablero cuadrado
  },
  controls: {
    flexDirection: "column",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
  },
});
