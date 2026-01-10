import React, {useState, useCallback, useEffect} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View, StyleSheet } from "react-native";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { AttentionGame } from "@/components/FocusGame";
import { Text, Snackbar, Portal, Dialog, Button } from "react-native-paper";
import { Stack, router } from "expo-router";

export type Achievement = {
  id: string,
  title: string,
  icon?: string | null,
  description?: string
}

export default function AttentionGameScreen() {
  const ROUNDS = 10;

  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [gameResults, setGameResults] = useState<{
    correct: number;
    rounds: number;
    achievements: Achievement[];
  } | null>(null);

  const handleAchievementUnlocked = useCallback(
    (achievement: Achievement) => {
      console.log("🎉 Agregando logro a la cola:", achievement.title);
      setAchievementQueue((prev) => [...prev, achievement]);
    },
    [],
  );

  // Procesar cola de logros (mostrar uno a la vez)
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
    (stats: {
      correct: number;
      rounds: number;
      achievements: Array<{
        id: string;
        title: string;
        icon?: string | null;
        description?: string;
      }>;
    }) => {
      setGameResults(stats);

      // Mostrar el diálogo de resultados después de un pequeño delay
      // (para dar tiempo a ver el toast si hay logros)
      const delay = stats.achievements.length > 0 ? 3000 : 0;
      setTimeout(() => {
        setShowResultsDialog(true);
      }, delay);
    },
    [],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
  }, []);

  const handleAchievementsDialogClose = useCallback(() => {
    setShowAchievementsDialog(false);
    setShowResultsDialog(true);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View
          style={[
            STYLES.contentContainer,
            { paddingBottom: LAYOUT.bottomNavHeight },
          ]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 12 }}>
            Focus
          </Text>
          <Text style={{ marginBottom: 12, color: COLORS.textSecondary }}>
            Selecciona el color que indica la palabra (no el color del texto).
          </Text>

          <AttentionGame
            rounds={ROUNDS}
            onComplete={handleComplete}
            onAchievementUnlocked={handleAchievementUnlocked}
          />

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={{ backgroundColor: "#7C3AED", marginBottom: 16, borderRadius: 12 }}
            action={{
              label: "Ver",
              onPress: () => {
                setSnackbarVisible(false);
                setShowAchievementsDialog(true);
              },
              labelStyle: { color: "#FFF" },
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>{snackbarMessage}</Text>
          </Snackbar>

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
              <Dialog.Title style={styles.dialogTitle}>
                {gameResults && gameResults.rounds - gameResults.correct < 3 ? "¡Felicitaciones! 🎉" : "Game Over 😢"}
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsText}>
                    {gameResults && gameResults.rounds - gameResults.correct < 3
                      ? "¡Has completado el juego exitosamente!"
                      : "Inténtalo de nuevo, puedes hacerlo mejor."}
                  </Text>

                  <View style={styles.resultStats}>
                    <View style={styles.resultStat}>
                      <Text style={styles.resultIcon}>🎯</Text>
                      <Text style={styles.resultLabel}>Aciertos</Text>
                      <Text style={styles.resultValue}>
                        {gameResults?.correct || 0}
                      </Text>
                    </View>
                    <View style={styles.resultStat}>
                      <Text style={styles.resultIcon}>
                        {gameResults && gameResults.rounds - gameResults.correct < 3 ? "🏆" : "💀"}
                      </Text>
                      <Text style={styles.resultLabel}>Resultado</Text>
                      <Text style={styles.resultValue}>
                        {gameResults && gameResults.rounds - gameResults.correct < 3 ? "Ganaste" : "Perdiste"}
                      </Text>
                    </View>
                  </View>

                  {/* Mostrar logros desbloqueados si los hay */}
                  {gameResults && gameResults.achievements.length > 0 && (
                    <View style={styles.achievementsSection}>
                      <Text style={styles.achievementsSectionTitle}>🏆 Logros Desbloqueados</Text>
                      <View style={styles.achievementsContainer}>
                        {gameResults.achievements.map((achievement) => (
                          <View key={achievement.id} style={styles.achievementItem}>
                            <Text style={styles.achievementIcon}>
                              {achievement.icon || "🏆"}
                            </Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.achievementTitle}>
                                {achievement.title}
                              </Text>
                              {achievement.description && (
                                <Text
                                  style={{
                                    color: COLORS.textSecondary,
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}
                                >
                                  {achievement.description}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
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

          {/* Diálogo de logros desbloqueados (cuando se presiona Ver desde snackbar) */}
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
              <Dialog.Title style={styles.dialogTitle}>
                🏆 ¡Logros Desbloqueados!
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.achievementsContainer}>
                  {gameResults && gameResults.achievements.map((achievement) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                      <Text style={styles.achievementIcon}>
                        {achievement.icon || "🏆"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.achievementTitle}>
                          {achievement.title}
                        </Text>
                        {achievement.description && (
                          <Text
                            style={{
                              color: COLORS.textSecondary,
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {achievement.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button
                  mode="contained"
                  onPress={handleAchievementsDialogClose}
                  style={styles.dialogButton}
                >
                  Cerrar
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
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 16,
    marginBottom: 16,
  },
  resultStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  resultIcon: {
    fontSize: 32,
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
  achievementsSection: {
    width: "100%",
    marginTop: 8,
  },
  achievementsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
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
    color: COLORS.text,
    fontWeight: "600",
  },
  dialogButton: {
    borderRadius: 12,
  },
  dialogActions: {
    flexDirection: "column",
    gap: 8,
    padding: 16,
  },
});
