import { useState, useEffect, useCallback, useRef } from "react";
import { CardState } from "@/components/MemoryGame/MemoryCard";
import {
  usePostPuzzlesMemory,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
  usePostAchievementsCheckAttemptId,
} from "@elepad/api-client";

export interface Card {
  id: number;
  symbol: string;
  state: CardState;
  pairId: number;
}

export interface GameStats {
  moves: number;
  timeElapsed: number;
  isComplete: boolean;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  icon?: string;
  description?: string;
}

const SYMBOLS = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
];

interface UseMemoryGameProps {
  onAchievementUnlocked?: (achievement: UnlockedAchievement) => void;
}

export const useMemoryGame = (props?: UseMemoryGameProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievement[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedAttempt = useRef(false);

  // API Hooks
  const createPuzzle = usePostPuzzlesMemory();
  const startAttempt = usePostAttemptsStart();
  const finishAttempt = usePostAttemptsAttemptIdFinish();
  const checkAchievements = usePostAchievementsCheckAttemptId();

  // Inicializar el tablero con persistencia
  const initializeGame = useCallback(async () => {
    // Limpiar estado anterior
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setIsComplete(false);
    setIsGameStarted(false);
    setAttemptId(null);
    setPuzzleId(null);
    setUnlockedAchievements([]);
    hasFinishedAttempt.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;

    try {
      // Crear puzzle en el backend
      console.log("🎮 Llamando a POST /puzzles/memory...");
      const puzzleData = await createPuzzle.mutateAsync({
        data: {
          rows: 4,
          cols: 6,
          difficulty: 2,
        },
      });

      console.log("📦 Datos recibidos del API:", puzzleData);

      if (!puzzleData) {
        console.error("❌ Respuesta vacía del API");
        throw new Error("Failed to create puzzle");
      }

      // Verificar que sea una respuesta exitosa (status 201)
      if ("status" in puzzleData && puzzleData.status !== 201) {
        console.error("❌ Status de respuesta inválido:", puzzleData.status);
        throw new Error("Failed to create puzzle");
      }

      // Extraer datos (puede estar en data o directamente en puzzleData)
      const responseData = "data" in puzzleData ? puzzleData.data : puzzleData;

      if (!responseData || typeof responseData !== "object") {
        console.error("❌ Datos de respuesta inválidos");
        throw new Error("Invalid response data");
      }

      const { puzzle, memoryGame } = responseData as {
        puzzle: { id: string };
        memoryGame: { layout: number[]; symbols: string[] };
      };

      if (!memoryGame) {
        console.error("❌ No hay datos de memoryGame en la respuesta");
        throw new Error("No memory game data received");
      }

      console.log("✅ Puzzle creado exitosamente:", puzzle.id);
      setPuzzleId(puzzle.id);

      // Construir las cartas desde la respuesta del backend
      const gameCards: Card[] = memoryGame.layout.map(
        (symbolIndex: number, index: number) => ({
          id: index,
          symbol: memoryGame.symbols[symbolIndex],
          state: "hidden" as CardState,
          pairId: symbolIndex,
        }),
      );

      setCards(gameCards);
      console.log("🎴 Cartas generadas desde API:", gameCards.length);
    } catch (error) {
      console.error(
        "❌ Error initializing game with API, using fallback:",
        error,
      );
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      // Fallback a generación local
      const pairs = SYMBOLS.slice(0, 12);
      const gameCards: Card[] = [];

      pairs.forEach((symbol, index) => {
        gameCards.push({
          id: index * 2,
          symbol,
          state: "hidden" as CardState,
          pairId: index,
        });
        gameCards.push({
          id: index * 2 + 1,
          symbol,
          state: "hidden" as CardState,
          pairId: index,
        });
      });

      const shuffled = gameCards.sort(() => Math.random() - 0.5);
      setCards(shuffled);
    }
  }, [createPuzzle]);

  // Inicializar al montar (solo una vez)
  const isInitializing = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && !isInitializing.current) {
      isInitializing.current = true;
      hasInitialized.current = true;
      initializeGame().finally(() => {
        isInitializing.current = false;
      });
    }
  }, [initializeGame]);

  // Temporizador
  useEffect(() => {
    if (isGameStarted && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGameStarted, isComplete]);

  // Voltear una carta
  const flipCard = useCallback(
    async (cardId: number) => {
      // Iniciar el juego en el primer movimiento
      if (!isGameStarted) {
        setIsGameStarted(true);
        startTimeRef.current = Date.now();

        // Iniciar el intento en el backend
        if (puzzleId && !attemptId) {
          try {
            const attemptData = await startAttempt.mutateAsync({
              data: {
                puzzleId,
                gameType: "memory",
              },
            });

            if (attemptData) {
              const responseData =
                "data" in attemptData ? attemptData.data : attemptData;
              const attemptId = (responseData as { id: string }).id;
              setAttemptId(attemptId);
              console.log("✅ Intento iniciado:", attemptId);
            }
          } catch (error) {
            console.error("❌ Error starting attempt:", error);
            // Continuar el juego aunque falle el intento
          }
        }
      }

      // No permitir voltear más de 2 cartas
      if (flippedCards.length >= 2) return;

      // No permitir voltear la misma carta dos veces
      if (flippedCards.includes(cardId)) return;

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);

      // Actualizar el estado de la carta
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? { ...card, state: "visible" as CardState }
            : card,
        ),
      );

      // Si se voltearon 2 cartas, verificar si coinciden
      if (newFlippedCards.length === 2) {
        setMoves((prev) => prev + 1);

        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
          // ¡Coinciden!
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstId || card.id === secondId
                  ? { ...card, state: "matched" as CardState }
                  : card,
              ),
            );
            setFlippedCards([]);
          }, 500);
        } else {
          // No coinciden, voltear de nuevo después de 1 segundo
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstId || card.id === secondId
                  ? { ...card, state: "hidden" as CardState }
                  : card,
              ),
            );
            setFlippedCards([]);
          }, 1000);
        }
      }
    },
    [cards, flippedCards, isGameStarted, puzzleId, attemptId, startAttempt],
  );

  // Verificar si el juego está completo
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.state === "matched")) {
      setIsComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Finalizar el intento en el backend (solo una vez)
      const finishGameAttempt = async () => {
        if (attemptId && startTimeRef.current && !hasFinishedAttempt.current) {
          hasFinishedAttempt.current = true;

          try {
            const durationMs = Date.now() - startTimeRef.current;
            const durationSeconds = Math.floor(durationMs / 1000);
            const score = Math.max(
              0,
              Math.floor(1000 - durationSeconds * 5 - moves * 10),
            );

            await finishAttempt.mutateAsync({
              attemptId,
              data: {
                success: true,
                moves,
                durationMs,
                score,
              },
            });

            console.log("✅ Intento finalizado con score:", score);

            // Verificar logros desbloqueados
            try {
              console.log("🔍 Verificando logros para attemptId:", attemptId);
              const achievementsData = await checkAchievements.mutateAsync({
                attemptId,
              });

              console.log("📦 Respuesta de logros:", achievementsData);

              if (achievementsData) {
                const responseData =
                  "data" in achievementsData
                    ? achievementsData.data
                    : achievementsData;
                console.log("📋 Datos procesados:", responseData);

                const achievements = responseData as Array<{
                  id: string;
                  title: string;
                  icon?: string;
                  description?: string;
                }>;

                if (achievements && achievements.length > 0) {
                  setUnlockedAchievements(achievements);
                  console.log(
                    "🏆 Logros desbloqueados:",
                    achievements.length,
                    achievements,
                  );

                  // Notificar cada logro desbloqueado
                  achievements.forEach((achievement) => {
                    props?.onAchievementUnlocked?.(achievement);
                  });
                } else {
                  console.log("ℹ️ No se desbloquearon logros nuevos");
                }
              } else {
                console.log("⚠️ No hay datos de logros");
              }
            } catch (error) {
              console.error("❌ Error checking achievements:", error);
            }
          } catch (error) {
            console.error("❌ Error finishing attempt:", error);
          }
        }
      };

      finishGameAttempt();
    }
  }, [cards, attemptId, moves, finishAttempt, checkAchievements]);

  const resetGame = useCallback(() => {
    hasInitialized.current = false;
    initializeGame();
  }, [initializeGame]);

  const stats: GameStats = {
    moves,
    timeElapsed,
    isComplete,
  };

  return {
    cards,
    flipCard,
    resetGame,
    stats,
    isProcessing: flippedCards.length >= 2,
    unlockedAchievements,
  };
};
