import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  usePostPuzzlesFocus,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
} from "@elepad/api-client";

export interface FocusStats {
  correct: number;
  rounds: number;
  durationMs?: number;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  icon?: string | null;
  description?: string;
}

interface UseFocusGameProps {
  onAchievementUnlocked?: (achievement: UnlockedAchievement) => void;
  rounds: number;
}

export const useFocusGame = (props: UseFocusGameProps) => {
  const { onAchievementUnlocked } = props;
  const { markGameCompleted } = useAuth();

  const queryClient = useQueryClient();

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
      startTimeRef.current = Date.now();

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
    [puzzleId, startAttempt],
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
      if (!attemptId || hasFinishedAttempt.current) return null;

      hasFinishedAttempt.current = true;
      const durationMs =
        stats.durationMs ??
        (startTimeRef.current ? Date.now() - startTimeRef.current : 0);

      try {
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
          },
        });

        setIsRunning(false);

        if ("status" in finishResponse && finishResponse.status !== 200) {
          console.error(
            "❌ Status de respuesta inválido:",
            finishResponse.status,
          );
          throw new Error("Failed to create puzzle");
        }

        // Invalidar queries de rachas para refrescar datos (solo si success es true)
        if (success) {
          queryClient.invalidateQueries({ queryKey: ['getStreaksMe'] });
          queryClient.invalidateQueries({ queryKey: ['getStreaksHistory'] });
        }

        // Manejo de Logros
        const resData = finishResponse.data;
        if (
          resData?.unlockedAchievements &&
          resData.unlockedAchievements.length > 0
        ) {
          const newAchievements =
            resData.unlockedAchievements as UnlockedAchievement[];
          setUnlockedAchievements(newAchievements);

          newAchievements.forEach((achievement) => {
            onAchievementUnlocked?.(achievement);
          });
        }

        return finishResponse;
      } catch (error) {
        console.error("❌ Error finishing focus attempt", error);
        hasFinishedAttempt.current = false;
        throw error;
      }
    },
    [attemptId, finishAttempt, onAchievementUnlocked],
  );

  const resetGame = useCallback(() => {
    hasInitialized.current = false;
    initializeGame();
  }, [initializeGame]);

  return {
    // State
    puzzleId,
    attemptId,
    isRunning,
    isLoading,
    unlockedAchievements,
    // Actions
    startGame,
    finishGame,
    resetGame,
  };
};
