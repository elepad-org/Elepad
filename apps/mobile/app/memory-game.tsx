import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button } from "react-native-paper";
import { router } from "expo-router";
import { MemoryGameBoard } from "@/components/MemoryGame/MemoryGameBoard";
import { COLORS } from "@/styles/base";

export default function MemoryGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [gameResults, setGameResults] = useState<{
    moves: number;
    timeElapsed: number;
  } | null>(null);

  const handleQuit = useCallback(() => {
    setShowQuitDialog(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setShowQuitDialog(false);
    router.back();
  }, []);

  const handleComplete = useCallback(
    (stats: { moves: number; timeElapsed: number }) => {
      setGameResults(stats);
      setShowResultsDialog(true);
    },
    [],
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.container}>
        {/* Título */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            🧠 Juego de Memoria
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Encuentra todas las parejas
          </Text>
        </View>

        {/* Tablero de juego */}
        <MemoryGameBoard onQuit={handleQuit} onComplete={handleComplete} />

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
              <Button onPress={() => setShowQuitDialog(false)}>Cancelar</Button>
              <Button onPress={confirmQuit} textColor={COLORS.error}>
                Salir
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
    marginBottom: 24,
    color: COLORS.text,
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
});
