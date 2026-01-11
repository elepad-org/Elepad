import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AttentionGameCore, COLORS_MAP, ColorName } from "./game";
import { Button, Portal, Dialog } from "react-native-paper";
import { router } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";
import CancelButton from "@/components/shared/CancelButton";
import { useFocusGame } from "@/hooks/useFocusGame";
import { GameLoadingView } from "@/components/shared";
import { Achievement } from "@/app/focus-game";

type Props = {
  rounds?: number;
  onComplete?: (stats: {
    correct: number;
    rounds: number;
    achievements: Achievement[];
  }) => void;
  onAchievementUnlocked?: (achievement: Achievement) => void;
};

export default function AttentionGame({
  rounds = 10,
  onComplete,
  onAchievementUnlocked,
}: Props) {
  const core = useMemo(() => new AttentionGameCore(), []);
  const [, setTick] = useState(0);
  const [score, setScore] = useState({ correct: 0, rounds: rounds });
  const [lives, setLives] = useState(3);
  const [lastResult, setLastResult] = useState<boolean | null>(null);  

  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);
  const [gameId, setGameId] = useState<string>(Date.now().toString());
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [achievementsSection, setAchievementsSection] = useState<Achievement[]>([])
  
  const hasCalledOnComplete = useRef(false);
  const isCheckingAchievements = useRef(false);
  const lastCompletedGameId = useRef<string | null>(null);
  const prevGameId = useRef<string>(gameId);

  // Hook de Focus Game para manejar API
  const focus = useFocusGame({
    rounds,
    onAchievementUnlocked,
  });

  // Detectar cuando cambia el gameId INMEDIATAMENTE
  if (prevGameId.current !== gameId) {
    console.log(
      "🔄 GameId cambió de",
      prevGameId.current,
      "a",
      gameId,
      "- Reseteando flags INMEDIATAMENTE",
    );
    prevGameId.current = gameId;
    hasCalledOnComplete.current = false;
    isCheckingAchievements.current = false;
  }

  // Cuando el juego se completa, marcar que estamos verificando logros
  useEffect(() => {
    if (isGameComplete && !hasCalledOnComplete.current) {
      isCheckingAchievements.current = true;
      console.log(
        "🎮 Juego completado (gameId:",
        gameId,
        "), esperando verificación de logros...",
      );
    }
  }, [isGameComplete, gameId]);

  // Cuando se completa el juego Y se han verificado los logros, notificar al padre
  useEffect(() => {
    if (
      isGameComplete &&
      isCheckingAchievements.current &&
      !hasCalledOnComplete.current
    ) {
      // Verificar que no sea el mismo juego completado anteriormente
      if (lastCompletedGameId.current === gameId) {
        console.log("⚠️ Ignorando completion duplicado del juego:", gameId);
        return;
      }

      // Esperar un poco para dar tiempo a que los logros se procesen
      const timer = setTimeout(() => {
        hasCalledOnComplete.current = true;
        isCheckingAchievements.current = false;
        lastCompletedGameId.current = gameId;
        console.log(
          "🎊 Notificando juego completado (gameId:",
          gameId,
          ") con logros:",
          achievementsSection,
        );
        onComplete?.({
          correct: score.correct,
          rounds,
          achievements: achievementsSection,
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    isGameComplete,
    score.correct,
    rounds,
    achievementsSection,
    onComplete,
    gameId,
  ]);

  // Resetear el flag cuando se reinicia el juego
  useEffect(() => {
    if (!isGameComplete) {
      hasCalledOnComplete.current = false;
      isCheckingAchievements.current = false;
    }
  }, [isGameComplete]);

  useEffect(() => {
    core.startRound();
    setTick((t) => t + 1);
  }, [core]);

  const prompt = core.currentPrompt;

  const restartGame = useCallback(() => {
    // Generar nuevo ID de juego
    const newGameId = Date.now().toString();
    setGameId(newGameId);
    console.log("🆕 Nuevo juego iniciado con ID:", newGameId);
    
    core.reset();
    core.startRound();
    setScore({ correct: 0, rounds });
    setLives(3);
    setLastResult(null);
    setShowQuitDialog(false);
    setCurrentRound(1);
    setIsGameComplete(false);
    setTick((t) => t + 1);
    
    // Resetear el juego en el hook
    focus.resetGame();
  }, [core, rounds, focus]);

  const handleQuit = useCallback(() => {
    setShowQuitDialog(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setShowQuitDialog(false);
    router.back();
  }, []);

  const handleSelection = (selection: ColorName) => {
    if (!prompt || showQuitDialog) return;
    const correct = core.handleSelection(selection);
    setLastResult(correct);
    
    const newCorrectScore = score.correct + (correct ? 1 : 0);
    setScore({ correct: newCorrectScore, rounds });
    setCurrentRound((prev) => prev + 1);
    setTick((t) => t + 1);

    // Lógica de juego
    if (!correct) {
      setLives((prev) => {
        const remaining = prev - 1;
        if (remaining <= 0) {
          // PERDIÓ
          setTimeout(async () => {
            // Finalizar el intento en el backend
            setAchievementsSection(await focus.finishGame(
              { correct: newCorrectScore, rounds },
              false // perdió
            ) as Achievement[]);
            setIsGameComplete(true);
          }, 350);
        } else {
          // Sigue jugando tras error
          setTimeout(() => {
            core.next();
            core.startRound();
            setLastResult(null);
            setTick((t) => t + 1);
          }, 350);
        }
        return remaining;
      });
    } else {
      // Acierto
      if (currentRound === rounds) {
        // GANÓ
        setTimeout(async () => {
          // Finalizar el intento en el backend
          setAchievementsSection( await focus.finishGame(
            { correct: newCorrectScore, rounds },
            true // ganó
          ) as Achievement[]);
          setIsGameComplete(true);
        }, 350);
      } else {
        // Sigue jugando tras acierto
        setTimeout(() => {
          core.next();
          core.startRound();
          setLastResult(null);
          setTick((t) => t + 1);
        }, 350);
      }
    }
  };

  // Mostrar loading a pantalla completa
  if (focus.isLoading) {
    return <GameLoadingView message="Preparando el juego..." />;
  }

  return (
    <View style={styles.container}>
      {/* Estadísticas superiores */}
      <View style={styles.statsCard}>
        <View style={styles.statsContent}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>🎯 Ronda</Text>
            <Text style={styles.statValue}>
              {Math.min(currentRound, rounds)} / {rounds}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>✅ Aciertos</Text>
            <Text style={styles.statValue}>{score.correct}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>❤️ Vidas</Text>
            <Text style={styles.statValue}>{lives}</Text>
          </View>
        </View>
      </View>

      {/* Área del Prompt (palabra) */}
      <View
        style={[
          styles.promptBox,
          {
            backgroundColor: "rgba(0,0,0,0.05)",
            borderWidth: lastResult === null ? 0 : 4,
            borderColor:
              lastResult === null
                ? "transparent"
                : lastResult
                  ? "#4CAF50"
                  : "#E53935",
          },
        ]}
      >
        {prompt ? (
          <Text style={[styles.promptText, { color: prompt.fillColor }]}>
            {prompt.word}
          </Text>
        ) : (
          <Text style={styles.promptText}>Pulsa iniciar</Text>
        )}
      </View>

      {/* Opciones de colores */}
      <View style={styles.grid}>
        {Object.keys(COLORS_MAP).map((k) => {
          const key = k as ColorName;
          const bg = COLORS_MAP[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.colorButton, { backgroundColor: bg }]}
              onPress={() => handleSelection(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.colorLabel,
                  { color: bg === "#FFFFFF" ? "#000" : "#fff" },
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botones de control inferiores */}
      <View style={styles.controls}>
        <Button 
            mode="contained" 
            onPress={restartGame} 
            icon="refresh" 
            style={styles.actionButton}
            buttonColor={COLORS.secondary}
        >
          Reiniciar
        </Button>
        <Button 
            mode="outlined" 
            onPress={handleQuit} 
            icon="exit-to-app" 
            style={styles.actionButton}
        >
          Salir
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showQuitDialog}
          onDismiss={() => setShowQuitDialog(false)}
          style={styles.dialogContainer}
        >
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
            ¿Salir de la partida?
          </Dialog.Title>
          <Dialog.Content style={{ paddingBottom: 8 }}>
            <Text style={{ ...STYLES.subheading, marginTop: 0 }}>
              Si abandonas ahora, perderás tu progreso actual. ¿Estás seguro de que quieres salir?
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  statsCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  promptBox: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 24,
  },
  promptText: {
    fontSize: 48,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    marginBottom: 24,
  },
  colorButton: {
    width: "45%",
    aspectRatio: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  colorLabel: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 20,
    paddingBottom: 5,
  },
  controls: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginTop: "auto",
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  dialogContainer: {
    backgroundColor: COLORS.background,
    width: "90%",
    alignSelf: "center",
    borderRadius: 16,
    paddingVertical: 14,
  },
  resultsContainer: {
    alignItems: "center",
  },
  resultsText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
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
    fontSize: 24,
    marginBottom: 8,
  },
  resultLabel: {
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontSize: 12,
  },
  resultValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
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