import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button, Snackbar } from "react-native-paper";
import { router, Stack } from "expo-router";
import { NetGameBoard } from "@/components/NetGame/NetGameBoard";
import { GameHeader } from "@/components/shared/GameHeader";
import { InstructionsDialog } from "@/components/shared/InstructionsDialog";
import { COLORS } from "@/styles/base";

export default function NetGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [wasSolvedAutomatically, setWasSolvedAutomatically] = useState(false);
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
    (
      stats: { moves: number; timeElapsed: number },
      isSolvedAutomatically: boolean,
    ) => {
      setWasSolvedAutomatically(isSolvedAutomatically);

      const score = calculateScore(stats.timeElapsed, stats.moves);
      setGameResults({ ...stats, score });

      // Mostrar el diálogo de resultados
      setTimeout(() => {
        setShowResultsDialog(true);
      }, 500);
    },
    [calculateScore],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
    setWasSolvedAutomatically(false);
    // El juego se reiniciará automáticamente al cambiar el key
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
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
          {/* Título con botón de retroceso */}
          <GameHeader
            icon="lan"
            title="NET"
            subtitle="Conecta toda la red girando las casillas"
            onHelpPress={() => setShowHelpDialog(true)}
            iconColor="#2196F3"
            useIconComponent={true}
          />

          {/* Tablero de juego */}
          <NetGameBoard
            gridSize={5}
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

          {/* Diálogo de ayuda/instrucciones */}
          <Portal>
            <InstructionsDialog
              visible={showHelpDialog}
              onDismiss={() => setShowHelpDialog(false)}
              title="🎮 Cómo Jugar NET"
            >
              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                🎯 Objetivo del Juego
              </Text>
              <Text variant="bodyMedium" style={styles.helpText}>
                Conecta todas las casillas de la red girándolas hasta formar una
                red completamente conectada sin circuitos cerrados (loops).
              </Text>

              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                🕹️ Controles
              </Text>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  <Text style={styles.helpBold}>Toca una casilla</Text> para
                  rotarla 90° en sentido horario
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  <Text style={styles.helpBold}>Mantén presionado</Text> para
                  bloquear/desbloquear una casilla
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                🎨 Colores
              </Text>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  <Text style={[styles.helpBold, { color: COLORS.success }]}>
                    Verde claro
                  </Text>
                  : Casilla conectada a la red principal
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  <Text style={styles.helpBold}>Blanco</Text>: Casilla no
                  conectada aún
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  <Text style={[styles.helpBold, { color: "#FFA726" }]}>
                    Amarillo
                  </Text>
                  : Casilla bloqueada (no se puede rotar)
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                ✅ Condiciones de Victoria
              </Text>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  1.
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  Todas las casillas deben estar conectadas (verdes)
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  2.
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  NO debe haber circuitos cerrados (loops)
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                ⚠️ ¿Qué es un Loop?
              </Text>
              <Text variant="bodyMedium" style={styles.helpText}>
                Un loop es un camino que vuelve sobre sí mismo formando un
                circuito cerrado. Por ejemplo, si puedes seguir las conexiones y
                volver al punto de inicio sin retroceder, ¡hay un loop!
              </Text>
              <Text variant="bodyMedium" style={styles.helpText}>
                La red debe ser un árbol (sin ciclos), donde hay exactamente un
                camino entre cualquier par de casillas.
              </Text>

              <Text variant="titleMedium" style={styles.helpSectionTitle}>
                💡 Consejos
              </Text>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  Empieza desde el centro y expándete hacia afuera
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  Bloquea las casillas que estés seguro que están correctas
                </Text>
              </View>
              <View style={styles.helpListItem}>
                <Text variant="bodyMedium" style={styles.helpBullet}>
                  •
                </Text>
                <Text variant="bodyMedium" style={styles.helpText}>
                  Si todas están verdes pero no ganas, busca y elimina loops
                </Text>
              </View>
            </InstructionsDialog>
          </Portal>

          {/* Diálogo de resultados */}
          <Portal>
            <Dialog
              visible={showResultsDialog}
              onDismiss={() => setShowResultsDialog(false)}
            >
              <Dialog.Icon icon={wasSolvedAutomatically ? "robot" : "trophy"} />
              <Dialog.Title style={styles.dialogTitle}>
                {wasSolvedAutomatically
                  ? "Juego Terminado"
                  : "¡Felicitaciones! 🎉"}
              </Dialog.Title>
              <Dialog.Content>
                <View style={styles.resultsContainer}>
                  <Text variant="bodyLarge" style={styles.resultsText}>
                    {wasSolvedAutomatically
                      ? "El juego se resolvió automáticamente. ¡Mejor suerte para la próxima!"
                      : "¡Has completado la red!"}
                  </Text>

                  {/* Puntaje destacado - solo mostrar si NO fue resuelto automáticamente */}
                  {!wasSolvedAutomatically &&
                    gameResults?.score !== undefined && (
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
    paddingHorizontal: 0, // Sin padding horizontal para que el tablero ocupe todo el ancho
    paddingVertical: 16,
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
  helpSectionTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  helpText: {
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  helpListItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  helpBullet: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: 8,
    width: 20,
  },
  helpBold: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
});
