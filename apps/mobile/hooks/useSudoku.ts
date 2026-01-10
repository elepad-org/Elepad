import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getTodayLocal } from "@/lib/dateHelpers";
import {
  usePostPuzzlesSudoku,
  //PostPuzzlesSudoku201,
  //PostPuzzlesSudoku201SudokuGame,
  //PostPuzzlesSudoku201Puzzle,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
  PostAttemptsAttemptIdFinish200UnlockedAchievementsItem,
} from "@elepad/api-client";

export type Difficulty = "easy" | "medium" | "hard";

export type PuzzleSudokuGame = {
  puzzle: {
    id: string,
    gameType: "memory" | "logic" | "attention" | "reaction",
    gameName: string | null,
    title: string | null,
    difficulty: number | null,
    createdAt: string,
  },
  sudokuGame: {
    given: number[][],
    solution: number[][]
  }
}

export interface SudokuCell {
  row: number;
  col: number;
  value: number | null; // El valor actual (1-9 o null)
  solutionValue: number; // El valor correcto (para validación local)
  isReadOnly: boolean; // Si es una pista inicial (no se puede editar)
  isError: boolean; // Si el usuario ingresó un número incorrecto
  notes: number[]; // (Opcional) Para modo "lápiz"
}

export interface SudokuStats {
  mistakes: number;
  moves: number;
  timeElapsed: number;
  isComplete: boolean;
}

export interface UseSudokuProps {
  difficulty: Difficulty;
  maxMistakes?: number;
  onGameOver?: () => void; // Callback si pierde por errores
  onAchievementUnlocked?: (
    achievement: PostAttemptsAttemptIdFinish200UnlockedAchievementsItem
  ) => void;
}

// --- Hook Principal ---

export const useSudoku = (props: UseSudokuProps) => {
  const {
    difficulty,
    maxMistakes = 3,
    onAchievementUnlocked,
    onGameOver,
  } = props;
  const { markGameCompleted } = useAuth();

  // Estados del juego
  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [filledCells, setFilledCells] = useState(0);

  // Estados de control (Timer, API, Loading)
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // IDs para el backend
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Refs para lógica interna
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedAttempt = useRef(false);
  const isStartingAttempt = useRef(false);

  const queryClient = useQueryClient();

  // API Hooks
  const createPuzzle = usePostPuzzlesSudoku();
  const startAttempt = usePostAttemptsStart();
  const finishAttempt = usePostAttemptsAttemptIdFinish();

  // --- Lógica de Inicialización ---

  const initializeGame = useCallback(async () => {
    // Resetear estados
    setBoard([]);
    setMistakes(0);
    setFilledCells(0);
    setTimeElapsed(0);
    setIsComplete(false);
    setIsGameStarted(false);
    setAttemptId(null);
    setSelectedCell(null);
    hasFinishedAttempt.current = false;
    isStartingAttempt.current = false;
    setIsLoading(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;

    try {
      console.log("🧩 Creando Sudoku nivel:", difficulty);

      const puzzleResponse = await createPuzzle.mutateAsync({
        data: { difficulty },
      });

      if (!puzzleResponse) {
        console.error("❌ Respuesta vacía del API");
        throw new Error("Failed to create puzzle");
      }

      // Verificar que sea una respuesta exitosa (status 201)
      if ("status" in puzzleResponse && puzzleResponse.status !== 201) {
        console.error(
          "❌ Status de respuesta inválido:",
          puzzleResponse.status
        );
        throw new Error("Failed to create puzzle");
      }

      // Validaciones de respuesta (similar a tu ejemplo)
      const responseData =
        "data" in puzzleResponse ? puzzleResponse.data as PuzzleSudokuGame : puzzleResponse as PuzzleSudokuGame;

      const {puzzle, sudokuGame} = responseData;
      setPuzzleId(puzzle.id);

      if (!sudokuGame) {
        throw new Error("Error recibiendo el puzzle de Sudoku");
      }

      // Construir el tablero local
      const newBoard: SudokuCell[][] = (sudokuGame.given as number[][]).map(
        (row: number[], rowIndex: number) =>
          row.map((val: number, colIndex: number) => ({
            row: rowIndex,
            col: colIndex,
            value: val !== 0 ? val : null,
            solutionValue: (sudokuGame.solution as number[][])[rowIndex][
              colIndex
            ],
            isReadOnly: val !== 0, // Si viene con valor, es fijo
            isError: false,
            notes: [],
          }))
      );

      // Calcular celdas iniciales llenas
      let initialFilled = 0;
      newBoard.forEach((row) =>
        row.forEach((cell) => {
          if (cell.value !== null) initialFilled++;
        })
      );
      console.log("Celdas llenas: ", initialFilled);

      setBoard(newBoard);
      setFilledCells(initialFilled);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error inicializando Sudoku:", error);
      setIsLoading(false);
    }
  }, [createPuzzle]);
  // Inicializar
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

  // --- Temporizador ---
  useEffect(() => {
    if (isGameStarted && !isComplete) {
      timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameStarted, isComplete]);

  // --- Lógica del Juego ---

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (isComplete) return;
      const cell = board[row][col];
      if (!cell.isReadOnly) {
        setSelectedCell({ row, col });
      } else {
        setSelectedCell({ row, col });
      }
    },
    [board, isComplete]
  );

  // TODO: Revisar si tiene sentido que esten separadas las funciones de LoseGame y QuitGame
  // Las dos hacen lo mismo practicamente por ahora
  const quitGame = useCallback(async () => {
    // Detener el temporizador
    if (timerRef.current) clearInterval(timerRef.current);

    if (hasFinishedAttempt.current) return;

    // Finalizar el intento en el backend
    if (attemptId && startTimeRef.current) {
      hasFinishedAttempt.current = true;
      const durationMs = Date.now() - startTimeRef.current;

      try {
        const response = await finishAttempt.mutateAsync({
          attemptId,
          data: {
            success: false,
            moves: 0,
            durationMs,
            score: 0,
            clientDate: getTodayLocal(),
          },
        });
        console.log("❌ Intento abandonado:", response);
      } catch (e) {
        console.error("Error al abandonar la partida", e);
      }
    }
  }, [attemptId, filledCells]);

  const loseGame = useCallback(async () => {
    console.log("Has perdido........")
    // Detener el temporizador
    if (timerRef.current) clearInterval(timerRef.current);

    if (hasFinishedAttempt.current) return;

    // Finalizar el intento en el backend
    if (attemptId && startTimeRef.current) {
      hasFinishedAttempt.current = true;
      const durationMs = Date.now() - startTimeRef.current;

      try {
        const response = await finishAttempt.mutateAsync({
          attemptId,
          data: {
            success: false,
            moves: filledCells,
            durationMs,
            score: 81 - maxMistakes,
            clientDate: getTodayLocal(),
          },
        });
        console.log("❌ Intento abandonado:", response);
      } catch (e) {
        console.error("Error al abandonar la partida", e);
      }
    }
  }, [attemptId, filledCells]);

  const handleNumberInput = useCallback(
    (number: number) => {
      if (!selectedCell || isComplete || isLoading) return;

      const { row, col } = selectedCell;
      const currentCell = board[row][col];

      // No editar si es celda fija
      if (currentCell.isReadOnly) return;

      // 1. Iniciar juego y timer en el primer movimiento
      if (!isGameStarted) {
        setIsGameStarted(true);
        startTimeRef.current = Date.now();

        // Iniciar attempt en backend
        if (puzzleId && !attemptId && !isStartingAttempt.current) {
          isStartingAttempt.current = true;
          startAttempt
            .mutateAsync({
              data: { puzzleId, gameType: "attention" },
            })
            .then((res) => {
              if("status" in res && res.status !== 201){
                console.error("Error iniciando el intento de sudoku");
                throw new Error("Failed to start attempt");
              }
                const id = "id" in res ? res.id : res.data.id;
                setAttemptId(id as string);
                console.log("✅ Attempt iniciado:", id);
              
            })
            .catch((err) => {
              console.error("❌ Error iniciando attempt:", err);
            });
          }
      }

      // 2. Lógica de validación
      const isCorrect = number === currentCell.solutionValue;

      const newBoard = [...board];
      const newRow = [...newBoard[row]];

      if (isCorrect) {
        newRow[col] = {
          ...currentCell,
          value: number,
          isError: false,
          //notes: [], // Limpiar notas si acierta
        };
        newBoard[row] = newRow;
        setBoard(newBoard);
        setFilledCells((prev) => prev + 1);
      } else {
        // MOVIMIENTO INCORRECTO
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);

        if (newMistakes >= maxMistakes && onGameOver) {
          loseGame();
          onGameOver();
        }

        // Mostrar error visualmente
        newRow[col] = {
          ...currentCell,
          value: number,
          isError: true,
        };
        newBoard[row] = newRow;
        setBoard(newBoard);

        // Opcional: Quitar el número incorrecto después de un delay
        setTimeout(() => {
          setBoard((prevBoard) => {
            const cleanBoard = [...prevBoard];
            const cleanRow = [...cleanBoard[row]];
            cleanRow[col] = { ...cleanRow[col], value: null, isError: false };
            cleanBoard[row] = cleanRow;
            return cleanBoard;
          });
        }, 1000);
      }
    },
    [
      board,
      selectedCell,
      isComplete,
      isGameStarted,
      puzzleId,
      attemptId,
      maxMistakes,
      onGameOver,
      mistakes,
      loseGame,
    ]
  );

  // --- Verificación de Victoria ---

  useEffect(() => {
    if (
      filledCells === 81 &&
      isGameStarted &&
      !isComplete &&
      !hasFinishedAttempt.current
    ) {
      if (timerRef.current) clearInterval(timerRef.current);

      const finishGame = async () => {
        if (attemptId && startTimeRef.current) {
          hasFinishedAttempt.current = true;
          const durationMs = Date.now() - startTimeRef.current;

          const score = 81 - mistakes;

          try {
            // 🔥 Actualización optimista de la racha ANTES de llamar al backend
            await markGameCompleted();

            const finishResponse = await finishAttempt.mutateAsync({
              attemptId,
              data: {
                success: true,
                moves: filledCells,
                durationMs,
                score: score,
                clientDate: getTodayLocal(),
              },
            });

            if ("status" in finishResponse && finishResponse.status !== 200) {
              console.error(
                "❌ Status de respuesta inválido:",
                finishResponse.status
              );
              throw new Error("Failed to finish attempt");
            }

            // Invalidar queries de rachas para refrescar datos
            queryClient.invalidateQueries({ queryKey: ["getStreaksMe"] });
            queryClient.invalidateQueries({ queryKey: ["getStreaksHistory"] });

            // Manejo de Logros
            const resData =
              "data" in finishResponse ? finishResponse.data : finishResponse;
            if (
              resData?.unlockedAchievements &&
              resData.unlockedAchievements.length > 0
            ) {
              resData.unlockedAchievements.forEach(
                (
                  achievement: PostAttemptsAttemptIdFinish200UnlockedAchievementsItem
                ) => {
                  onAchievementUnlocked?.(achievement);
                }
              );
            }
          } catch (e) {
            console.error("Error finalizando attempt", e);
          }
        }
      };
      setIsComplete(true);
      finishGame();
    }
  }, [filledCells, isGameStarted, isComplete, attemptId, mistakes]);

  // --- Helpers ---
  // TODO: Todavia no se usa
  const eraseCell = useCallback(() => {
    if (!selectedCell || isComplete) return;
    const { row, col } = selectedCell;
    if (board[row][col].isReadOnly) return;

    const newBoard = [...board];
    newBoard[row][col] = { ...newBoard[row][col], value: null, isError: false };
    setBoard(newBoard);
  }, [board, selectedCell, isComplete]);

  const resetGame = useCallback(() => {
    hasInitialized.current = false;
    initializeGame();
  }, [initializeGame]);

  return {
    board,
    selectedCell,
    mistakes,
    timeElapsed,
    isComplete,
    isLoading,
    difficulty,
    actions: {
      selectCell: handleCellPress,
      inputNumber: handleNumberInput,
      erase: eraseCell,
      resetGame,
      quitGame,
    },
  };
};
