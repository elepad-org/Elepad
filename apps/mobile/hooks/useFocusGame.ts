import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getTodayLocal } from "@/lib/dateHelpers";
import {
  usePostPuzzlesFocus,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
} from "@elepad/api-client";
import { useFocusAchievementPrediction, type PredictedAchievement } from "./useFocusAchievementPrediction";

export interface FocusStats {
  correct: number;
  rounds: number;
  durationMs?: number;
}

export interface UnlockedAchievement {
  id: string;
  code: string;
  title: string;
  icon?: string | null;
  description?: string | null;
  points: number;
}

interface UseFocusGameProps {
  rounds: number;
}

export const useFocusGame = (props: UseFocusGameProps) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const { predictAchievements, validatePrediction } = useFocusAchievementPrediction();
  const { markGameCompleted } = useAuth();

  // API Hooks
  const createPuzzle = usePostPuzzlesFocus();
  const startAttempt = usePostAttemptsStart();
  const finishAttempt = usePostAttemptsAttemptIdFinish();

  // State
  const [puzzleId, setPuzzleId] = useState<string>();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievement[]
  >([]);

  // Refs para control de flujo
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedAttempt = useRef(false);
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

  // 1. Inicializar
  const initializeGame = useCallback(async () => {
    // Reset de estados
    setIsRunning(false);
    setAttemptId(null);
    setPuzzleId("");
    setUnlockedAchievements([]);
    hasFinishedAttempt.current = false;
    startTimeRef.current = null; // Resetear el timer
    setIsLoading(true);

    try {
      const puzzleData = await createPuzzle.mutateAsync({
        data: {
          rounds: props.rounds,
        },
      });

      if ("status" in puzzleData && puzzleData.status !== 201) {
        console.error("❌ Status de respuesta inválido:", puzzleData.status);
        throw new Error("Failed to create puzzle");
      }

      const responseData = "data" in puzzleData ? puzzleData.data : puzzleData;

      if (!responseData || !responseData.puzzle) {
        throw new Error("Invalid puzzle response");
      }

      const newPuzzleId = responseData.puzzle.id;
      setPuzzleId(newPuzzleId);
      setIsLoading(false);

      console.log("✅ Focus Puzzle creado:", newPuzzleId);

      return newPuzzleId;
    } catch (error) {
      console.error("❌ Error al inicializar Focus Game:", error);
      const fallbackId = `local-${Date.now()}`;
      setPuzzleId(fallbackId);
      setIsLoading(false);
      return fallbackId;
    }
  }, []);

  // 2. Iniciar el Intento
  const startGame = useCallback(
    async (manualPuzzleId?: string) => {
      const currentPuzzleId = manualPuzzleId || puzzleId;

      console.log("Puzzle ID a usar:", currentPuzzleId);

      if (!currentPuzzleId) {
        console.error("No hay puzzleId disponible para iniciar");
        return;
      }

      setIsRunning(true);
      // NO iniciar el timer aquí - se inicia en la primera interacción del usuario
      // startTimeRef.current = Date.now();

      const res = await startAttempt
        .mutateAsync({
          data: {
            puzzleId: currentPuzzleId,
            gameType: "reaction",
          },
        })
        .then((attemptData) => {
          if (attemptData) {
            const responseData =
              "data" in attemptData ? attemptData.data : attemptData;
            const newAttemptId = (responseData as { id: string }).id;
            setAttemptId(newAttemptId);
            console.log("✅ Intento iniciado:", newAttemptId);
          }
        })
        .catch((error) => {
          console.error("❌ Error starting attempt:", error);
        });
      console.log("Respuesta de Inicio de Intento:", res);
    },
    [puzzleId, startAttempt]
  );

  useEffect(() => {
    if (!hasInitialized.current && !isInitializing.current) {
      isInitializing.current = true;
      hasInitialized.current = true;

      initializeGame()
        .then((newId) => {
          if (newId) {
            startGame(newId);
          }
        })
        .catch((err) => console.error("Error en cadena de inicio", err))
        .finally(() => {
          isInitializing.current = false;
        });
    }
  }, [initializeGame, startGame]);

  // 3. Finalizar el Intento
  const finishGame = useCallback(
    async (stats: FocusStats, success: boolean) => {
      if (!attemptId || hasFinishedAttempt.current) return { predictedAchievements: [], finalAchievements: [] };

      hasFinishedAttempt.current = true;
      const durationMs =
        stats.durationMs ??
        (startTimeRef.current ? Date.now() - startTimeRef.current : 0);

      try {
        // Variable para guardar los logros predichos (para validación posterior)
        let predictedAchievements: PredictedAchievement[] = [];

        // 🔮 PREDICCIÓN OPTIMISTA: Predecir logros ANTES de llamar al backend
        if (success && user) {
          // Calcular score usando la MISMA fórmula del backend
          const moves = stats.rounds - stats.correct; // Errores cometidos
          const durationSeconds = durationMs / 1000;
          const timePenalty = durationSeconds * 5;
          const movesPenalty = moves * 10;
          const predictedScore = Math.max(
            0,
            Math.floor(1000 - timePenalty - movesPenalty),
          );

          console.log("[FRONTEND SCORE PREDICTION]");
          console.log(`  Duration: ${durationMs}ms (${durationSeconds.toFixed(2)}s)`);
          console.log(`  Correct: ${stats.correct} / ${stats.rounds}`);
          console.log(`  Moves (errores): ${moves}`);
          console.log(`  Time penalty: ${durationSeconds.toFixed(2)} * 5 = ${timePenalty.toFixed(2)}`);
          console.log(`  Moves penalty: ${moves} * 10 = ${movesPenalty}`);
          console.log(`  Predicted score: 1000 - ${timePenalty.toFixed(2)} - ${movesPenalty} = ${predictedScore}`);

          predictedAchievements = predictAchievements({
            gameType: "reaction",
            gameName: "focus",
            success: true,
            score: predictedScore, // Usar score calculado con fórmula del backend
            moves,
            durationMs,
            userId: user.id,
          });

          console.log(`🔮 Logros predichos: ${predictedAchievements.length}`);

          // Mostrar logros predichos INMEDIATAMENTE
          if (predictedAchievements.length > 0) {
            setUnlockedAchievements(predictedAchievements);
          }
        }

        // 🔥 Actualización optimista de la racha si fue exitoso
        if (success) {
          await markGameCompleted();
        }

        const finishResponse = await finishAttempt.mutateAsync({
          attemptId,
          data: {
            success,
            durationMs,
            moves: stats.rounds - stats.correct, // Es para calcular el puntaje en backend
            clientDate: getTodayLocal(),
          },
        });

        
        if ("status" in finishResponse && finishResponse.status !== 200) {
          console.error(
            "❌ Status de respuesta inválido:",
            finishResponse.status
          );
          throw new Error("Failed to create puzzle");
        }

        setIsRunning(false);

        // Validar predicción con respuesta real del backend
        const resData = "data" in finishResponse ? finishResponse.data : finishResponse;
        
        if (resData && "unlockedAchievements" in resData) {
          console.log(`🎯 Logros reales del backend: ${resData.unlockedAchievements?.length || 0}`);
          
          const realAchievements = (resData.unlockedAchievements || []) as UnlockedAchievement[];
          
          // Validar si la predicción fue correcta
          const isCorrect = validatePrediction(predictedAchievements, realAchievements);
          
          if (!isCorrect) {
            console.log("⚠️ Predicción incorrecta, actualizando con logros reales");
            setUnlockedAchievements(realAchievements);
          } else {
            console.log("✅ Predicción correcta, sin cambios");
          }
        }
        
        // Invalidar queries de rachas para refrescar datos (solo si success es true)
        if (success) {
          queryClient.invalidateQueries({ queryKey: ["getStreaksMe"] });
          queryClient.invalidateQueries({ queryKey: ["getStreaksHistory"] });
        }

        // Retornar logros predichos para uso inmediato
        return { 
          predictedAchievements,
          finalAchievements: resData.unlockedAchievements || []
        };
      } catch (error) {
        console.error("❌ Error finishing focus attempt", error);
        hasFinishedAttempt.current = false;
        throw error;
      }
    },
    [attemptId, finishAttempt, markGameCompleted, predictAchievements, user, validatePrediction, queryClient]
  );

  const resetGame = useCallback(() => {
    hasInitialized.current = false;
    // Invalidar achievements para recargar los logros actuales del usuario
    queryClient.invalidateQueries({ queryKey: ["/achievements/user/reaction"] });
    initializeGame();
  }, [initializeGame, queryClient]);

  /**
   * Inicia el cronómetro manualmente (llamado en la primera interacción)
   */
  const startTimer = useCallback(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, []);

  /**
   * Obtiene el tiempo transcurrido desde que inició el timer
   */
  const getDuration = useCallback(() => {
    return startTimeRef.current ? Date.now() - startTimeRef.current : 0;
  }, []);

  /**
   * Predice logros de forma síncrona sin llamar al backend
   * Retorna inmediatamente para mostrar en UI
   */
  const predictAchievementsSync = useCallback(
    (stats: FocusStats) => {
      if (!user) return [];

      const durationMs = stats.durationMs ?? getDuration();
      const moves = stats.rounds - stats.correct;
      const durationSeconds = durationMs / 1000;
      const timePenalty = durationSeconds * 5;
      const movesPenalty = moves * 10;
      const predictedScore = Math.max(
        0,
        Math.floor(1000 - timePenalty - movesPenalty)
      );

      console.log("[FRONTEND SCORE PREDICTION - SYNC]");
      console.log(`  Duration: ${durationMs}ms (${durationSeconds.toFixed(2)}s)`);
      console.log(`  Correct: ${stats.correct} / ${stats.rounds}`);
      console.log(`  Moves (errores): ${moves}`);
      console.log(`  Predicted score: ${predictedScore}`);

      return predictAchievements({
        gameType: "reaction",
        gameName: "focus",
        success: true,
        score: predictedScore,
        moves,
        durationMs,
        userId: user.id,
      });
    },
    [user, getDuration, predictAchievements]
  );

  return {
    // State
    puzzleId,
    attemptId,
    isRunning,
    isLoading,
    unlockedAchievements,
    // Actions
    startGame,
    startTimer,
    getDuration,
    predictAchievementsSync,
    finishGame,
    resetGame,
  };
};
