import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Dialog, Button } from "react-native-paper";
import { router, Stack } from "expo-router";
import { NetGameBoard } from "@/components/NetGame/NetGameBoard";
import { InstructionsDialog } from "@/components/shared/InstructionsDialog";
import { COLORS, STYLES } from "@/styles/base";
import { GAMES_INFO } from "@/constants/gamesInfo";
import { GameInstructions } from "@/components/shared/GameInstructions";
import CancelButton from "@/components/shared/CancelButton";
import { GameCompletedModal } from "@/components/GameCompletedModal";

export default function NetGameScreen() {
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [wasSolvedAutomatically, setWasSolvedAutomatically] = useState(false);
  const [gameResetCounter, setGameResetCounter] = useState(0);
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



  const handleComplete = useCallback(
    (
      stats: {
        moves: number;
        timeElapsed: number;
        score: number;
        achievements?: Array<{
          id: string;
          title: string;
          icon?: string | null;
          description?: string | null;
          points: number;
        }>;
      },
      isSolvedAutomatically: boolean,
    ) => {
      setWasSolvedAutomatically(isSolvedAutomatically);

      const score = stats.score;
      setGameResults({
        moves: stats.moves,
        timeElapsed: stats.timeElapsed,
        score,
        achievements: stats.achievements,
      });

      // Mostrar el diálogo de resultados
      setTimeout(() => {
        setShowResultsDialog(true);
      }, 500);
    },
    [],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    setGameResults(null);
    setWasSolvedAutomatically(false);
    setGameResetCounter((prev) => prev + 1);
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
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
          <NetGameBoard
            key={`net-5-${gameResetCounter}`}
            gridSize={5}
            onQuit={handleQuit}
            onComplete={handleComplete}
          />

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
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <CancelButton onPress={() => setShowQuitDialog(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    mode="contained"
                    onPress={confirmQuit}
                    buttonColor={COLORS.primary}
                    style={{ borderRadius: 12 }}
                  >
                    Salir
                  </Button>
                </View>
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
              <GameInstructions gameInfo={GAMES_INFO.net} variant="dialog" />
            </InstructionsDialog>
          </Portal>

          {/* Modal de resultados con logros */}
          <GameCompletedModal
            visible={showResultsDialog}
            onDismiss={() => setShowResultsDialog(false)}
            onPlayAgain={handlePlayAgain}
            onBackToGames={handleBackToGames}
            success={!wasSolvedAutomatically}
            score={wasSolvedAutomatically ? undefined : gameResults?.score}
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
    paddingHorizontal: 0, // Sin padding horizontal para que el tablero ocupe todo el ancho
    paddingVertical: 16,
  },
});
