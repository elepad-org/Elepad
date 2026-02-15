import { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Text, Button, Card, Icon } from "react-native-paper";
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
    score: number;
    mistakes: number;
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
    score,
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
        score,
        mistakes,
        achievements: unlockedAchievements,
      });
    }
  }, [isComplete, userMoves, timeElapsed, score, mistakes, onComplete, unlockedAchievements]);

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
              Tiempo
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {formatTime(timeElapsed)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              Movimientos
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {userMoves}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={styles.statLabel}>
              Errores
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
          <View style={styles.keyboard}>
            {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keyboardRow}>
                {row.map((num) => (
                  <Button
                    key={num}
                    mode="contained"
                    onPress={() => actions.inputNumber(num)}
                    disabled={!selectedCell || isComplete}
                    style={[
                      styles.numpadButton,
                      {
                        backgroundColor: COLORS.backgroundSecondary,
                        elevation: 0,
                      }
                    ]}
                    labelStyle={styles.numberButtonLabel}
                    textColor={COLORS.primary}
                    contentStyle={{ height: 60 }} // Altura fija para botones grandes
                  >
                    {num}
                  </Button>
                ))}
              </View>
            ))}
            
            <View style={styles.keyboardRow}>
              {/* Espacio vacío para balancear el grid */}
              <Button
                mode="text"
                style={[styles.numpadButton, { opacity: 0 }]}
                disabled
              >
                {""}
              </Button>

              <Button
                mode="contained"
                onPress={actions.erase}
                disabled={!selectedCell || isComplete}
                style={[
                  styles.numpadButton,
                  {
                    backgroundColor: COLORS.backgroundSecondary,
                    elevation: 0,
                  }
                ]}
                contentStyle={{ height: 60 }}
              >
                <Icon source="backspace-outline" size={28} color={COLORS.primary} />
              </Button>

              {/* Espacio vacío para balancear el grid */}
              <Button
                mode="text"
                style={[styles.numpadButton, { opacity: 0 }]}
                disabled
              >
                {""}
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
    elevation: 0,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: "500",
  },
  statValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  boardContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: "100%",
  },
  board: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.backgroundSecondary,
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
    borderColor: "#BDBDBD",
    // Aseguramos que el contenido interno respete los bordes redondeados
    overflow: "hidden", 
  },
  blockTopLeft: {
    borderTopLeftRadius: 12,
  },
  blockTopRight: {
    borderTopRightRadius: 12,
  },
  blockBottomLeft: {
    borderBottomLeftRadius: 12,
  },
  blockBottomRight: {
    borderBottomRightRadius: 12,
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
    marginTop: 24,
    width: "100%",
    maxWidth: 320, // Limitar ancho para que no se estire demasiado en tablets
    alignSelf: "center",
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  numpadButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: "center",
  },
  numberButtonLabel: {
    fontSize: 24,
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
    borderRadius: 12,
  },
});
