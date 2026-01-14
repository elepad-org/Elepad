import { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button } from "react-native-paper";
import { router, Stack } from "expo-router";
import { SudokuGameBoard } from "@/components/SudokuGame/SudokuGameBoard";
import { InstructionsDialog } from "@/components/shared/InstructionsDialog";
import { COLORS, STYLES } from "@/styles/base";
import { GAMES_INFO } from "@/constants/gamesInfo";
import { GameInstructions } from "@/components/shared/GameInstructions";
import CancelButton from "@/components/shared/CancelButton";
import { GameCompletedModal } from "@/components/GameCompletedModal";
import type { Difficulty } from "@/hooks/useSudoku";

export default function SudokuGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResults, setGameResults] = useState<{
    moves: number;
    timeElapsed: number;
    hasWon: boolean;
    achievements?: Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string | null;
      points: number;
    }>;
  } | null>(null);

  const handleQuit = useCallback(() => {
    setShowQuitDialog(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setShowQuitDialog(false);
    router.back();
  }, []);

  const handleComplete = useCallback(
    (stats: {
      moves: number;
      timeElapsed: number;
      achievements?: Array<{
        id: string;
        title: string;
        icon?: string | null;
        description?: string | null;
        points: number;
      }>;
    }) => {
      setGameResults({ ...stats, hasWon: true });

      setTimeout(() => {
        setShowResultsDialog(true);
      }, 500);
    },
    []
  );

  const handleGameOver = useCallback(() => {
    // Cuando el jugador pierde por errores
    setShowResultsDialog(true);
    setGameResults({
      moves: 0,
      timeElapsed: 0,
      hasWon: false,
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
    setGameStarted(false);
    setShowDifficultyDialog(true);
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
  }, []);

  const handleDifficultySelect = useCallback(
    (selectedDifficulty: Difficulty) => {
      setDifficulty(selectedDifficulty);
      setShowDifficultyDialog(false);
      setGameStarted(true);
    },
    []
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.container}>
          {/* Tablero */}
          {gameStarted && (
            <SudokuGameBoard
              key={`sudoku-${difficulty}-${gameStarted}`}
              difficulty={difficulty}
              onQuit={handleQuit}
              onComplete={handleComplete}
              onGameOver={handleGameOver}
            />
          )}

          {/* Diálogo de selección de dificultad */}
          <Portal>
            <Dialog
              visible={showDifficultyDialog}
              dismissable={false}
              style={{
                backgroundColor: COLORS.background,
                width: "90%",
                alignSelf: "center",
                borderRadius: 16,
                paddingVertical: 14,
              }}
            >
              <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
                Selecciona la dificultad
              </Dialog.Title>
              <Dialog.Content style={{ paddingBottom: 8 }}>
                <Text
                  style={{
                    ...STYLES.subheading,
                    marginTop: 0,
                    marginBottom: 16,
                  }}
                >
                  Elige el nivel de dificultad del juego
                </Text>
              </Dialog.Content>
              <Dialog.Actions style={styles.modeActions}>
                <View style={styles.modeButtonsContainer}>
                  <Button
                    mode="contained"
                    onPress={() => handleDifficultySelect("easy")}
                    style={styles.modeButton}
                    buttonColor={COLORS.secondary}
                    contentStyle={styles.buttonContent}
                  >
                    Fácil
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleDifficultySelect("medium")}
                    style={styles.modeButton}
                    buttonColor={COLORS.primary}
                    contentStyle={styles.buttonContent}
                  >
                    Medio
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleDifficultySelect("hard")}
                    style={styles.modeButton}
                    buttonColor="#F44336"
                    contentStyle={styles.buttonContent}
                  >
                    Difícil
                  </Button>
                </View>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Diálogo de confirmación para salir */}
          <Portal>
            <Dialog
              visible={showQuitDialog}
              onDismiss={() => setShowQuitDialog(false)}
              style={{
                backgroundColor: COLORS.background,
                width: "90%",
                alignSelf: "center",
                borderRadius: 16,
                paddingVertical: 14,
              }}
            >
              <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
                ¿Salir de la partida?
              </Dialog.Title>
              <Dialog.Content style={{ paddingBottom: 8 }}>
                <Text style={{ ...STYLES.subheading, marginTop: 0 }}>
                  Si abandonas ahora, perderás tu progreso actual. ¿Estás seguro
                  de que quieres salir?
                </Text>
              </Dialog.Content>
              <Dialog.Actions
                style={{
                  paddingBottom: 12,
                  paddingHorizontal: 20,
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <CancelButton onPress={() => setShowQuitDialog(false)} />
                <Button
                  mode="contained"
                  onPress={confirmQuit}
                  buttonColor={COLORS.secondary}
                  style={{ borderRadius: 12, width: "100%" }}
                >
                  Salir
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Diálogo de ayuda/instrucciones */}
          <Portal>
            <InstructionsDialog
              visible={showHelpDialog}
              onDismiss={() => setShowHelpDialog(false)}
              title="🎮 Cómo Jugar Sudoku"
            >
              <GameInstructions gameInfo={GAMES_INFO.sudoku} variant="dialog" />
            </InstructionsDialog>
          </Portal>

          {/* Modal de resultados con logros */}
          <GameCompletedModal
            visible={showResultsDialog}
            onDismiss={() => setShowResultsDialog(false)}
            onPlayAgain={handlePlayAgain}
            onBackToGames={handleBackToGames}
            success={gameResults?.hasWon ?? false}
            time={gameResults?.hasWon && gameResults.timeElapsed ? gameResults.timeElapsed * 1000 : null}
            moves={gameResults?.hasWon ? gameResults.moves : null}
            achievements={gameResults?.achievements}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  modeActions: {
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  modeButtonsContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  modeButton: {
    width: "100%",
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  difficultyButtons: {
    gap: 12,
    marginTop: 8,
  },
  difficultyButton: {
    borderRadius: 12,
  },
});
