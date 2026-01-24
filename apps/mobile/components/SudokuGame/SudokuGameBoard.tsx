import { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { SudokuCell } from "./SudokuCell";
import { useSudoku, Difficulty } from "@/hooks/useSudoku";
import { GameLoadingView } from "@/components/shared";
import { COLORS } from "@/styles/base";

interface SudokuGameBoardProps {
  difficulty: Difficulty;
  onQuit: () => void;
  onComplete: (stats: {
    moves: number;
    timeElapsed: number;
    achievements?: Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string | null;
      points: number;
    }>;
  }) => void;
  onGameOver?: () => void;
}

export const SudokuGameBoard: React.FC<SudokuGameBoardProps> = ({
  difficulty,
  onQuit,
  onComplete,
  onGameOver,
}) => {
  const {
    board,
    selectedCell,
    mistakes,
    timeElapsed,
    userMoves,
    isComplete,
    isLoading,
    actions,
    unlockedAchievements,
  } = useSudoku({
    difficulty,
    maxMistakes: 3,
    onGameOver,
  });

  const hasCalledOnComplete = useRef(false);
  const [boardSize, setBoardSize] = useState(0);
  const { width: windowWidth } = useWindowDimensions();

  // Calcular el tamaño del tablero basado en el ancho de la pantalla
  useEffect(() => {
    const horizontalPadding = 32; // 16px de cada lado (como el Card de estadísticas)
    const availableWidth = windowWidth - horizontalPadding;
    setBoardSize(availableWidth);
  }, [windowWidth]);

  const handleQuit = () => {
    actions.quitGame();
    onQuit();
  };

  // Crear handlers memoizados para cada celda para evitar re-renders
  const createCellPressHandler = useCallback(
    (row: number, col: number) => () => {
      actions.selectCell(row, col);
    },
    [actions]
  );

  // Formatear el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Cuando el juego termina
  useEffect(() => {
    if (isComplete && !hasCalledOnComplete.current) {
      hasCalledOnComplete.current = true;
      console.log("🎊 Juego Sudoku completado");
      onComplete({
        moves: userMoves,
        timeElapsed,
        achievements: unlockedAchievements,
      });
    }
  }, [isComplete, userMoves, timeElapsed, onComplete, unlockedAchievements]);

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
              {userMoves}
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
          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {/* Renderizar el tablero como bloques 3x3 */}
            {[0, 1, 2].map((blockRow) => (
              <View key={`blockRow-${blockRow}`} style={styles.blockRow}>
                {[0, 1, 2].map((blockCol) => (
                  <View
                    key={`block-${blockRow}-${blockCol}`}
                    style={[
                      styles.block,
                      // Bordes redondeados en las esquinas del tablero
                      blockRow === 0 && blockCol === 0 && styles.blockTopLeft,
                      blockRow === 0 && blockCol === 2 && styles.blockTopRight,
                      blockRow === 2 && blockCol === 0 && styles.blockBottomLeft,
                      blockRow === 2 && blockCol === 2 && styles.blockBottomRight,
                    ]}
                  >
                    {/* Cada bloque 3x3 */}
                    {[0, 1, 2].map((cellRow) => {
                      const actualRow = blockRow * 3 + cellRow;
                      return (
                        <View key={`row-${actualRow}`} style={styles.row}>
                          {[0, 1, 2].map((cellCol) => {
                            const actualCol = blockCol * 3 + cellCol;
                            const cell = board[actualRow]?.[actualCol];
                            if (!cell) return null;
                            
                            return (
                              <SudokuCell
                                key={`cell-${actualRow}-${actualCol}`}
                                value={cell.value}
                                isReadOnly={cell.isReadOnly}
                                isError={cell.isError}
                                isSelected={
                                  selectedCell?.row === actualRow &&
                                  selectedCell?.col === actualCol
                                }
                                onPress={createCellPressHandler(actualRow, actualCol)}
                                disabled={isComplete}
                              />
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Botones de numeros */}
          <View style={[styles.keyboard, { width: boardSize }]}>
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
                Borrar
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
  },
  board: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.text,
    aspectRatio: 1, // Mantener cuadrado
    overflow: "hidden", // Para que los bordes redondeados de los bloques se vean bien
  },
  blockRow: {
    flexDirection: "row",
    flex: 1,
  },
  block: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#BDBDBD", // Gris más suave
  },
  blockTopLeft: {
    borderTopLeftRadius: 8,
  },
  blockTopRight: {
    borderTopRightRadius: 8,
  },
  blockBottomLeft: {
    borderBottomLeftRadius: 8,
  },
  blockBottomRight: {
    borderBottomRightRadius: 8,
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
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  numberButton: {
    flex: 1,
    minWidth: 60,
    minHeight: 48,
    justifyContent: "center",
    includeFontPadding: false,
  },
  numberButtonLabel: {
    fontSize: 20,
    fontWeight: "bold",
    includeFontPadding: false,
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
