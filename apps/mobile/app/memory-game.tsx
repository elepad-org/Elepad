import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Portal,
  Dialog,
  Button,
  IconButton,
  Snackbar,
} from "react-native-paper";
import { router, Stack } from "expo-router";
import { MemoryGameBoard } from "@/components/MemoryGame/MemoryGameBoard";
import { COLORS } from "@/styles/base";

export default function MemoryGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [gameResults, setGameResults] = useState<{
    moves: number;
    timeElapsed: number;
    score?: number;
    achievements?: Array<{
      id: string;
      title: string;
      icon?: string;
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

  const handleAchievementUnlocked = useCallback(
    (achievement: {
      id: string;
      title: string;
      icon?: string;
      description?: string;
    }) => {
      const icon = achievement.icon || "🏆";
      const message = `${icon} ¡Logro desbloqueado! ${achievement.title}`;
      console.log("🎉 Mostrando toast de logro:", message);
      setSnackbarMessage(message);
      setSnackbarVisible(true);
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
        icon?: string;
        description?: string;
      }>;
    }) => {
      const score = calculateScore(stats.timeElapsed, stats.moves);
      setGameResults({ ...stats, score });

      // Mostrar el diálogo de resultados después de un pequeño delay
      // (para dar tiempo a ver el toast si hay logros)
      const delay =
        stats.achievements && stats.achievements.length > 0 ? 3000 : 0;
      setTimeout(() => {
        setShowResultsDialog(true);
      }, delay);
    },
    [calculateScore],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
    // El juego se reiniciará automáticamente
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
  }, []);

  const handleAchievementsDialogClose = useCallback(() => {
    setShowAchievementsDialog(false);
    setShowResultsDialog(true);
  }, []);

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
          {/* Título con botón de retroceso flotante */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
              iconColor={COLORS.primary}
            />
            <Text variant="headlineMedium" style={styles.title}>
              🧠 Juego de Memoria
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Encuentra todas las parejas
            </Text>
          </View>

          {/* Tablero de juego */}
          <MemoryGameBoard
            onQuit={handleQuit}
            onComplete={handleComplete}
            onAchievementUnlocked={handleAchievementUnlocked}
          />

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

          {/* Diálogo de confirmación para salir */}
          <Portal>
            <Dialog
              visible={showQuitDialog}
              onDismiss={() => setShowQuitDialog(false)}
            >
              <Dialog.Icon icon="alert-circle" />
              <Dialog.Title style={styles.dialogTitle}>
                ¿Salir de la partida?
              </Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">
                  Si abandonas ahora, perderás tu progreso actual. ¿Estás seguro
                  de que quieres salir?
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowQuitDialog(false)}>
                  Cancelar
                </Button>
                <Button onPress={confirmQuit} textColor={COLORS.error}>
                  Salir
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Diálogo de logros desbloqueados */}
          <Portal>
            <Dialog
              visible={showAchievementsDialog}
              onDismiss={handleAchievementsDialogClose}
            >
              <Dialog.Icon icon="trophy-award" />
              <Dialog.Title style={styles.dialogTitle}>
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
              <Dialog.Actions>
                <Button
                  mode="contained"
                  onPress={handleAchievementsDialogClose}
                  buttonColor={COLORS.primary}
                >
                  Continuar
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Diálogo de resultados */}
          <Portal>
            <Dialog
              visible={showResultsDialog}
              onDismiss={() => setShowResultsDialog(false)}
            >
              <Dialog.Icon icon="trophy" />
              <Dialog.Title style={styles.dialogTitle}>
                ¡Felicitaciones! 🎉
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.resultsContainer}>
                  <Text variant="bodyLarge" style={styles.resultsText}>
                    ¡Has completado el juego!
                  </Text>

                  {/* Puntaje destacado */}
                  {gameResults?.score !== undefined && (
                    <View style={styles.scoreHighlight}>
                      <Text variant="titleLarge" style={styles.scoreIcon}>
                        🏆
                      </Text>
                      <Text variant="displaySmall" style={styles.scoreValue}>
                        {gameResults.score}
                      </Text>
                      <Text variant="bodyMedium" style={styles.scoreLabel}>
                        puntos
                      </Text>
                    </View>
                  )}

                  <View style={styles.resultStats}>
                    <View style={styles.resultStat}>
                      <Text variant="titleLarge" style={styles.resultIcon}>
                        ⏱️
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultLabel}>
                        Tiempo
                      </Text>
                      <Text variant="headlineSmall" style={styles.resultValue}>
                        {gameResults
                          ? formatTime(gameResults.timeElapsed)
                          : "--:--"}
                      </Text>
                    </View>
                    <View style={styles.resultStat}>
                      <Text variant="titleLarge" style={styles.resultIcon}>
                        🎯
                      </Text>
                      <Text variant="bodyMedium" style={styles.resultLabel}>
                        Movimientos
                      </Text>
                      <Text variant="headlineSmall" style={styles.resultValue}>
                        {gameResults?.moves || 0}
                      </Text>
                    </View>
                  </View>
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
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: -8,
    top: 0,
    zIndex: 1,
  },
  title: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dialogTitle: {
    textAlign: "center",
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
    backgroundColor: "#7C3AED", // Violeta hermoso
    marginBottom: 16,
    borderRadius: 12,
    elevation: 8,
  },
  snackbarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
