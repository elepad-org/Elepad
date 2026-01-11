import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button, Snackbar } from "react-native-paper";
import { router, Stack } from "expo-router";
import { SudokuGameBoard } from "@/components/SudokuGame/SudokuGameBoard";
import { InstructionsDialog } from "@/components/shared/InstructionsDialog";
import { COLORS, STYLES } from "@/styles/base";
import { GAMES_INFO } from "@/constants/gamesInfo";
import { GameInstructions } from "@/components/shared/GameInstructions";
import CancelButton from "@/components/shared/CancelButton";
import type { Difficulty } from "@/hooks/useSudoku";

export default function SudokuGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<
    Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string;
    }>
  >([]);
  const [gameResults, setGameResults] = useState<{
    moves: number;
    timeElapsed: number;
    hasWon: boolean;
    achievements?: Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string;
    }>;
  } | null>(null);

  const handleQuit = useCallback(() => {
    setShowQuitDialog(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setShowQuitDialog(false);
    router.back();
  }, []);

  const handleAchievementsDialogClose = useCallback(() => {
    setShowAchievementsDialog(false);
    setShowResultsDialog(true);
  }, []);

  const handleAchievementUnlocked = useCallback(
    (achievement: {
      id: string;
      title: string;
      icon?: string | null;
      description?: string;
    }) => {
      console.log("🎉 Agregando logro a la cola:", achievement.title);
      setAchievementQueue((prev) => [...prev, achievement]);
    },
    []
  );

  // TODO: Definir los logros y probar
  // Los logros se muestran uno x uno con un Snackbar
  useEffect(() => {
    if (achievementQueue.length > 0 && !snackbarVisible) {
      const nextAchievement = achievementQueue[0];
      const icon = nextAchievement.icon || "🏆";
      const message = `${icon} ¡Logro desbloqueado! ${nextAchievement.title}`;

      console.log("🎉 Mostrando snackbar:", message);
      setSnackbarMessage(message);
      setSnackbarVisible(true);

      // Remover de la cola cuando el Snackbar se cierre (3 segundos)
      setAchievementQueue((prev) => prev.slice(1));
    }
  }, [achievementQueue, snackbarVisible]);

  const handleComplete = useCallback(
    (stats: { moves: number; timeElapsed: number }) => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
              onAchievementUnlocked={handleAchievementUnlocked}
            />
          )}

          {/* Toast de logro desbloqueado */}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.achievementSnackbar}
            action={{
              label: "Ver",
              onPress: () => {
                setSnackbarVisible(false);
                setShowResultsDialog(true);
              },
              labelStyle: { color: "#FFF" },
            }}
          >
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          </Snackbar>

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
                  justifyContent: "space-between",
                }}
              >
                <CancelButton onPress={() => setShowQuitDialog(false)} />
                <Button
                  mode="contained"
                  onPress={confirmQuit}
                  buttonColor={COLORS.secondary}
                  style={{ borderRadius: 12 }}
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

          {/* Diálogo de resultados */}
          <Portal>
            <Dialog
              visible={showResultsDialog}
              onDismiss={() => setShowResultsDialog(false)}
              style={{
                backgroundColor: COLORS.background,
                width: "90%",
                alignSelf: "center",
                borderRadius: 16,
                paddingVertical: 14,
              }}
            >
              <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
                {gameResults?.hasWon === false
                  ? "Fin del juego 😢"
                  : "¡Felicitaciones! 🎉"}
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.resultsContainer}>
                  <Text variant="bodyLarge" style={styles.resultsText}>
                    {gameResults?.hasWon === false
                      ? "Demasiados errores. ¡Inténtalo de nuevo!"
                      : "¡Has completado el Sudoku!"}
                  </Text>

                  {gameResults?.hasWon && (
                    <View style={styles.resultStats}>
                      <View style={styles.resultStat}>
                        <Text variant="titleLarge" style={styles.resultIcon}>
                          ⏱️
                        </Text>
                        <Text variant="bodyMedium" style={styles.resultLabel}>
                          Tiempo
                        </Text>
                        <Text
                          variant="headlineSmall"
                          style={styles.resultValue}
                        >
                          {gameResults
                            ? formatTime(gameResults.timeElapsed)
                            : "--:--"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Dialog.Content>
              <Dialog.Actions style={styles.dialogActions}>
                <Button
                  mode="outlined"
                  onPress={handleBackToGames}
                  style={styles.dialogButton}
                >
                  Volver a Juegos
                </Button>
                <Button
                  mode="contained"
                  onPress={handlePlayAgain}
                  style={styles.dialogButton}
                  buttonColor={COLORS.primary}
                >
                  Jugar de Nuevo
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <Portal>
            <Dialog
              visible={showAchievementsDialog}
              onDismiss={handleAchievementsDialogClose}
              style={{
                backgroundColor: COLORS.background,
                width: "90%",
                alignSelf: "center",
                borderRadius: 16,
                paddingVertical: 14,
              }}
            >
              <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
                ¡Logros Desbloqueados! 🎉
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.achievementsContainer}>
                  {gameResults?.achievements?.map((achievement) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                      <Text
                        variant="titleMedium"
                        style={styles.achievementIcon}
                      >
                        🏅
                      </Text>
                      <Text variant="bodyLarge" style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </Dialog.Content>
              <Dialog.Actions
                style={{ paddingBottom: 12, paddingHorizontal: 20 }}
              >
                <Button
                  mode="contained"
                  onPress={handleAchievementsDialogClose}
                  buttonColor={COLORS.primary}
                  style={{ borderRadius: 12 }}
                >
                  Continuar
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
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
  achievementsContainer: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    flex: 1,
    color: COLORS.text,
    fontWeight: "600",
  },
  achievementSnackbar: {
    backgroundColor: "#7C3AED",
    marginBottom: 16,
    borderRadius: 12,
    elevation: 8,
  },
  snackbarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modeActions: {
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  modeButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  difficultyButtons: {
    gap: 12,
    marginTop: 8,
  },
  difficultyButton: {
    borderRadius: 12,
  },
  resultsContainer: {
    alignItems: "center",
  },
  resultsText: {
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.text,
  },
  scoreHighlight: {
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.primary + "15",
    borderRadius: 16,
    width: "100%",
  },
  scoreIcon: {
    marginBottom: 8,
  },
  scoreValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 48,
    lineHeight: 56,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 16,
  },
  resultStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  resultIcon: {
    marginBottom: 8,
  },
  resultLabel: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  dialogActions: {
    flexDirection: "column",
    gap: 8,
    padding: 16,
  },
  dialogButton: {
    width: "100%",
    borderRadius: 12,
  },
});
