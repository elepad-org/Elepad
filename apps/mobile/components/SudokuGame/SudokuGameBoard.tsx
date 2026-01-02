import { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { SudokuCell } from "./SudokuCell";
import { useSudoku, Difficulty } from "@/hooks/useSudoku";
import { GameLoadingView } from "@/components/shared";
import { COLORS } from "@/styles/base";

interface SudokuGameBoardProps {
  difficulty: Difficulty;
  onQuit: () => void;
  onComplete: (stats: { moves: number; timeElapsed: number }) => void;
  onGameOver?: () => void;
  onAchievementUnlocked?: (achievement: {
    id: string;
    title: string;
    icon?: string | null;
    description?: string;
  }) => void;
}

export const SudokuGameBoard: React.FC<SudokuGameBoardProps> = ({
  difficulty,
  onQuit,
  onComplete,
  onGameOver,
  onAchievementUnlocked,
}) => {
  const {
    board,
    selectedCell,
    mistakes,
    timeElapsed,
    isComplete,
    isLoading,
    actions,
  } = useSudoku({
    difficulty,
    maxMistakes: 3,
    onGameOver,
    onAchievementUnlocked,
  });

  const hasCalledOnComplete = useRef(false);

  const handleQuit = () => {
    actions.quitGame();
    onQuit();
  };

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calcular movimientos
  const moves = useMemo(() => {
    let count = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell.value !== null && !cell.isReadOnly) {
          count++;
        }
      }),
    );
    return count;
  }, [board]);

  // Cuando el juego termina
  useEffect(() => {
    if (isComplete && !hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;
      console.log("🎊 Juego Sudoku completado");
      onComplete({
        moves,
        timeElapsed,
      });
    }
  }, [isComplete, moves, timeElapsed, onComplete]);

  // Resetear el flag cuando se reinicia el juego
  useEffect(() => {
    if (!isComplete) {
      hasCalledOnComplete.current = false;
    }
  }, [isComplete]);

  // Animacion de carga
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
              {formatTime(timeElapsed)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              🎯 Movimientos
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {moves}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              ❌ Errores
            </Text>
            <Text
              variant="headlineSmall"
              style={[
                styles.statValue,
                mistakes >= 2 && { color: COLORS.error },
              ]}
            >
              {mistakes}/3
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Tablero */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {board.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => (
                  <View
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      colIndex === 2 || colIndex === 5
                        ? styles.cellRightBorder
                        : null,
                      rowIndex === 2 || rowIndex === 5
                        ? styles.cellBottomBorder
                        : null,
                    ]}
                  >
                    <SudokuCell
                      value={cell.value}
                      isReadOnly={cell.isReadOnly}
                      isError={cell.isError}
                      isSelected={
                        selectedCell?.row === rowIndex &&
                        selectedCell?.col === colIndex
                      }
                      onPress={() => actions.selectCell(rowIndex, colIndex)}
                      disabled={isComplete}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Botones de numeros */}
          <View style={styles.keyboard}>
            <View style={styles.keyboardRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  mode="contained-tonal"
                  onPress={() => actions.inputNumber(num)}
                  disabled={!selectedCell || isComplete}
                  style={styles.numberButton}
                  labelStyle={styles.numberButtonLabel}
                >
                  {num}
                </Button>
              ))}
            </View>
            <View style={styles.keyboardRow}>
              {[6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  mode="contained-tonal"
                  onPress={() => actions.inputNumber(num)}
                  disabled={!selectedCell || isComplete}
                  style={styles.numberButton}
                  labelStyle={styles.numberButtonLabel}
                >
                  {num}
                </Button>
              ))}
              <Button
                mode="outlined"
                onPress={actions.erase}
                disabled={!selectedCell || isComplete}
                style={styles.numberButton}
                labelStyle={styles.numberButtonLabel}
                icon="backspace-outline"
              >
                Del
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Controles */}
      <View style={styles.controls}>
        <Button
          mode="contained"
          onPress={actions.resetGame}
          icon="refresh"
          style={styles.button}
          buttonColor={COLORS.primary}
        >
          Reiniciar
        </Button>
        <Button
          mode="outlined"
          onPress={handleQuit}
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
    height: "100%",
    paddingHorizontal: 16,
  },
  board: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 8,
    width: "100%",
    height: "58%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  row: {
    flexDirection: "row",
    flex: 1,
  },
  cellRightBorder: {
    borderRightWidth: 2,
    borderRightColor: COLORS.text,
  },
  cellBottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.text,
  },
  keyboard: {
    marginTop: 16,
    width: "100%",
    maxWidth: 400,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  numberButton: {
    flex: 1,
    maxWidth: 70,
  },
  numberButtonLabel: {
    fontSize: 20,
    fontWeight: "bold",
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
