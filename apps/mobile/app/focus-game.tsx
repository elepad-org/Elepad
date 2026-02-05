import React, { useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { AttentionGame } from "@/components/FocusGame";
import { Text } from "react-native-paper";
import { Stack, router } from "expo-router";
import { GameCompletedModal } from "@/components/GameCompletedModal";

export type Achievement = {
  id: string,
  title: string,
  icon?: string | null,
  description?: string | null,
  points: number
}

export default function AttentionGameScreen() {
  const ROUNDS = 10;

  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [gameResults, setGameResults] = useState<{
    correct: number;
    rounds: number;
    errors: number;

    score: number;
    durationMs: number;
    achievements?: Achievement[];
  } | null>(null);
  const restartGameRef = useRef<(() => void) | null>(null);

  const handleComplete = useCallback(
    (stats: {
      correct: number;
      rounds: number;
      errors: number;

      score: number;
      durationMs: number;
      achievements?: Array<{
        id: string;
        title: string;
        icon?: string | null;
        description?: string | null;
        points: number;
      }>;
    }) => {
      setGameResults(stats);
      // Mostrar el diálogo de resultados INMEDIATAMENTE
      setShowResultsDialog(true);
    },
    [],
  );

  const handlePlayAgain = useCallback(() => {
    setShowResultsDialog(false);
    // Llamar la función de reinicio del juego
    if (restartGameRef.current) {
      restartGameRef.current();
    }
    setGameResults(null);
  }, []);

  const handleBackToGames = useCallback(() => {
    setShowResultsDialog(false);
    router.back();
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
            onRestartRef={restartGameRef}
          />

          {/* Modal de resultados con logros */}
          <GameCompletedModal
            visible={showResultsDialog}
            onDismiss={() => setShowResultsDialog(false)}
            onPlayAgain={handlePlayAgain}
            onBackToGames={handleBackToGames}
            success={gameResults ? gameResults.errors < 3 : false}
            customStats={[
              {
                icon: "🎯",
                label: "Puntaje",
                value: gameResults?.score || 0,
              },
              {
                icon: "⏱️",
                label: "Tiempo",
                value: gameResults?.durationMs ? `${Math.floor(gameResults.durationMs / 1000)}s` : "0s",
              },
              {
                icon: "✅",
                label: "Aciertos",
                value: gameResults?.correct || 0,
              },
              {
                icon: "❌",
                label: "Errores",
                value: gameResults?.errors || 0,
              },
            ]}
            achievements={gameResults?.achievements}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
