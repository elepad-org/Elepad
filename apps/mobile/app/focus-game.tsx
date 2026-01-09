import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { AttentionGame } from "@/components/FocusGame";
import { useFocusGame } from "@/hooks/useFocusGame";
import { Text, Snackbar } from "react-native-paper";
import { Stack } from "expo-router";

export default function AttentionGameScreen() {
  const ROUNDS = 10;

  const [achievementQueue, setAchievementQueue] = React.useState<
    Array<{
      id: string;
      title: string;
      icon?: string | null;
      description?: string;
    }>
  >([]);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  const handleAchievementUnlocked = React.useCallback(
    (achievement: { id: string; title: string; icon?: string | null }) => {
      console.log("🎉 Agregando logro a la cola:", achievement.title);
      setAchievementQueue((prev) => [...prev, achievement]);
    },
    [],
  );

  // Procesar cola de logros (mostrar uno a la vez)
  React.useEffect(() => {
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

  const focus = useFocusGame({ rounds: ROUNDS, onAchievementUnlocked: handleAchievementUnlocked });

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
    await focus.startGame();
  };

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
            onFinish={handleFinish}
            onRestart={handleRestart}
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
                console.log("Ver logros pressed");
              },
              labelStyle: { color: "#FFF" },
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>{snackbarMessage}</Text>
          </Snackbar>
        </View>
      </SafeAreaView>
    </>
  );
}
