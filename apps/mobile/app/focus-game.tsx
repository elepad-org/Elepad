import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { AttentionGame } from "@/components/FocusGame";
import { useFocusGame } from "@/hooks/useFocusGame";
import { Text } from "react-native-paper";
import { Stack } from "expo-router"; // <--- Importante: Importar Stack

export default function AttentionGameScreen() {
  const ROUNDS = 10;

  const focus = useFocusGame({ rounds: ROUNDS });

  const handleFinish = async (score: { correct: number; rounds: number }) => {
    const hasWon = score.rounds - score.correct < 3;
    try {
      await focus.finishGame(
        { correct: score.correct, rounds: score.rounds },
        hasWon,
      );
      console.log("Intento registrado: win/finish", score);
    } catch (e) {
      console.warn("Error registrando intento finish", e);
    }
  };

  const handleRestart = async (score: { correct: number; rounds: number }) => {
    try {
      await focus.finishGame(
        { correct: score.correct, rounds: score.rounds },
        false,
      );
      console.log("Intento registrado: restart", score);
    } catch (e) {
      console.warn("Error registrando intento restart", e);
    }
    // start a fresh attempt immediately
    await focus.startGame();
  };

  return (
    <>
      {/* Esto elimina la barra negra de navegación */}
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

          {/* El componente del juego ya incluye los botones de control */}
          <AttentionGame
            rounds={ROUNDS}
            onFinish={handleFinish}
            onRestart={handleRestart}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
