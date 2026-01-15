import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button } from "react-native-paper";
import { router, Stack } from "expo-router";
import { MemoryGameBoard } from "@/components/MemoryGame/MemoryGameBoard";
import { InstructionsDialog } from "@/components/shared/InstructionsDialog";
import { GameCompletedModal } from "@/components/GameCompletedModal";
import { COLORS, STYLES } from "@/styles/base";
import { GAMES_INFO } from "@/constants/gamesInfo";
import { GameInstructions } from "@/components/shared/GameInstructions";
import CancelButton from "@/components/shared/CancelButton";

type GameMode = "4x4" | "4x6";

export default function MemoryGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [showModeSelectionDialog, setShowModeSelectionDialog] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [gameResults, setGameResults] = useState<{
    moves: number;
    timeElapsed: number;
    score?: number;
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

  const calculateScore = useCallback(
    (durationSeconds: number, moves: number): number => {
      // Fórmula: Base 1000 puntos - penalización por tiempo y movimientos
      // Cada segundo resta 5 puntos, cada movimiento resta 10 puntos
      const timePenalty = durationSeconds * 5;
      const movesPenalty = moves * 10;

      const baseScore = 1000;
      const finalScore = Math.max(
        0,
        Math.floor(baseScore - timePenalty - movesPenalty),
      );

      return finalScore;
    },
    [],
  );



  const handleComplete = useCallback(
    (stats: {
      moves: number;
      timeElapsed: number;
      achievements: Array<{
        id: string;
        title: string;
        icon?: string | null;
        points: number;
        description?: string | null;
      }>;
    }) => {
      const score = calculateScore(stats.timeElapsed, stats.moves);
      setGameResults({ ...stats, score });

      // Mostrar el modal inmediatamente con los logros predichos
      setShowResultsDialog(true);
    },
    [calculateScore],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
    // NO cambiar el modo ni mostrar el modal de selección
    // El juego se reiniciará automáticamente al cerrar el diálogo
    // y el usuario puede usar el botón "Reiniciar" del tablero
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
  }, []);

  const handleAchievementsDialogClose = useCallback(() => {
    setShowAchievementsDialog(false);
    setShowResultsDialog(true);
  }, []);

  const handleModeSelection = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    setShowModeSelectionDialog(false);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.container}>
          {/* Tablero de juego */}
          {selectedMode && (
            <MemoryGameBoard
              mode={selectedMode}
              onQuit={handleQuit}
              onComplete={handleComplete}
            />
          )}

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
              title="🎮 Cómo Jugar Memoria"
            >
              <GameInstructions gameInfo={GAMES_INFO.memory} variant="dialog" />
            </InstructionsDialog>
          </Portal>

          {/* Diálogo de resultados */}

          {/* Diálogo de logros desbloqueados */}
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

          {/* Diálogo de selección de modo */}
          <Portal>
            <Dialog
              visible={showModeSelectionDialog}
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
                Elige el modo de juego
              </Dialog.Title>
              <Dialog.Content style={{ paddingBottom: 8 }}>
                <Text
                  style={{
                    ...STYLES.subheading,
                    marginTop: 0,
                    marginBottom: 16,
                  }}
                >
                  Selecciona la dificultad del juego
                </Text>
              </Dialog.Content>
              <Dialog.Actions style={styles.modeActions}>
                <View style={styles.modeButtonsContainer}>
                  <Button
                    mode="contained"
                    onPress={() => handleModeSelection("4x4")}
                    style={styles.modeButton}
                    buttonColor={COLORS.secondary}
                    icon="grid"
                    contentStyle={styles.buttonContent}
                  >
                    4x4 (Fácil)
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleModeSelection("4x6")}
                    style={styles.modeButton}
                    buttonColor={COLORS.primary}
                    icon="grid"
                    contentStyle={styles.buttonContent}
                  >
                    4x6 (Difícil)
                  </Button>
                </View>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Modal de resultados con logros */}
          <GameCompletedModal
            visible={showResultsDialog}
            onDismiss={() => setShowResultsDialog(false)}
            onPlayAgain={handlePlayAgain}
            onBackToGames={handleBackToGames}
            success={true}
            score={gameResults?.score}
            moves={gameResults?.moves}
            time={gameResults ? gameResults.timeElapsed * 1000 : undefined}
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
    paddingVertical: 16,
  },
  dialogTitle: {
    textAlign: "center",
  },
  modeDescription: {
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.textSecondary,
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
});
