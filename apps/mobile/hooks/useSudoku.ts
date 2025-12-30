import { useState, useEffect, useCallback, useRef } from "react";
// Asumo que estos hooks existen o los crearás siguiendo tu patrón actual
import {
  usePostPuzzlesSudoku,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
} from "@elepad/api-client";

// --- Tipos e Interfaces ---

export type Difficulty = "easy" | "medium" | "hard";

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
  mistakes: number; // Errores del jugador, sirve para terminar el juego en dev
  moves: number; // Cantidad de celdas rellenadas
  timeElapsed: number;
  isComplete: boolean;
}

export interface UseSudokuProps {
  difficulty: Difficulty;
  maxMistakes?: number; // Límite de errores permitidos (ej: 3)
  onGameOver?: () => void; // Callback si pierde por errores
  onAchievementUnlocked?: (achievement: any) => void;
}

// --- Hook Principal ---

export const useSudoku = (props: UseSudokuProps) => {
  const {
    difficulty,
    maxMistakes = 3,
    onAchievementUnlocked,
    onGameOver,
  } = props;

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
  const [gameId, setGameId] = useState<string>(Date.now().toString());

  // Refs para lógica interna
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedAttempt = useRef(false);
  const isStartingAttempt = useRef(false);

  // API Hooks
  const createPuzzle = usePostPuzzlesSudoku();
  const startAttempt = usePostAttemptsStart();
  const finishAttempt = usePostAttemptsAttemptIdFinish();

  // --- Lógica de Inicialización ---

  const initializeGame = useCallback(async () => {
    const newGameId = Date.now().toString();
    setGameId(newGameId);

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
          puzzleResponse.status,
        );
        throw new Error("Failed to create puzzle");
      }

      // Validaciones de respuesta (similar a tu ejemplo)
      const responseData =
        "data" in puzzleResponse ? puzzleResponse.data : puzzleResponse;

      const { puzzle, sudokuGame } = responseData;

      setPuzzleId(puzzle.id);

      if (!sudokuGame) {
        throw new Error("Error recibiendo el puzzle de Sudoku");
      }

      // Construir el tablero local
      const newBoard: SudokuCell[][] = sudokuGame.given.map(
        (row: number[], rowIndex: number) =>
          row.map((val: number, colIndex: number) => ({
            row: rowIndex,
            col: colIndex,
            value: val !== 0 ? val : null,
            solutionValue: sudokuGame.solution[rowIndex][colIndex],
            isReadOnly: val !== 0, // Si viene con valor, es fijo
            isError: false,
            notes: [],
          })),
      );

      // Calcular celdas iniciales llenas
      let initialFilled = 0;
      newBoard.forEach((row) =>
        row.forEach((cell) => {
          if (cell.value !== null) initialFilled++;
        }),
      );
      console.log("Celdas llenas: ", initialFilled);

      setBoard(newBoard);
      setFilledCells(initialFilled);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error inicializando Sudoku:", error);
      // Aquí podrías implementar un fallback local para generar sudokus offline
      setIsLoading(false);
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

  // --- Temporizador ---
  useEffect(() => {
    if (isGameStarted && !isComplete) {
      timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameStarted, isComplete]);

  // --- Lógica del Juego (Input) ---

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (isComplete) return;
      const cell = board[row][col];
      // Solo permitir seleccionar celdas editables
      if (!cell.isReadOnly) {
        setSelectedCell({ row, col });
      } else {
        // Opcional: Permitir seleccionar readOnly solo para resaltar números iguales
        setSelectedCell({ row, col });
      }
    },
    [board, isComplete],
  );

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

        // Iniciar attempt en backend (no bloqueante)
        if (puzzleId && !attemptId && !isStartingAttempt.current) {
          isStartingAttempt.current = true;
          startAttempt
            .mutateAsync({
              data: { puzzleId, gameType: "attention" },
            })
            .then((res: any) => {
              const id = res.data?.id || res.id;
              setAttemptId(id);
              console.log("✅ Attempt iniciado:", id);
            });
        }
      }

      // 2. Lógica de validación
      const isCorrect = number === currentCell.solutionValue;

      // Copiar tablero para inmutabilidad
      const newBoard = [...board];
      const newRow = [...newBoard[row]];

      if (isCorrect) {
        // MOVIMIENTO CORRECTO
        newRow[col] = {
          ...currentCell,
          value: number,
          isError: false,
          //notes: [], // Limpiar notas si acierta
        };
        newBoard[row] = newRow;
        setBoard(newBoard);
        setFilledCells((prev) => prev + 1);

        // Chequear si completó el número para animaciones (opcional) o si ganó
        // La verificación de victoria está en el useEffect
      } else {
        // MOVIMIENTO INCORRECTO
        setMistakes((prev) => {
          const newMistakes = prev + 1;
          if (newMistakes >= maxMistakes && onGameOver) {
            // Lógica de Game Over
            onGameOver();
          }
          return newMistakes;
        });

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
    ],
  );

  // --- Verificación de Victoria ---

  useEffect(() => {
    // 81 celdas en total
    if (
      filledCells === 81 &&
      isGameStarted &&
      !isComplete &&
      !hasFinishedAttempt.current
    ) {
      setIsComplete(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const finishGame = async () => {
        if (attemptId && startTimeRef.current) {
          hasFinishedAttempt.current = true;
          const durationMs = Date.now() - startTimeRef.current;

          // Cálculo de score simple
          const score = 81 - mistakes;

          try {
            const response = await finishAttempt.mutateAsync({
              attemptId,
              data: {
                success: true,
                moves: filledCells,
                durationMs,
                score: score,
              },
            });
            console.log(response);

            if (response.status !== 200) {
              console.error("Error al finalizar el intento", response.data);
              return;
            }

            // Manejo de logros (igual que en tu ejemplo)
            if (response.data?.unlockedAchievements) {
              response.data.unlockedAchievements.forEach((a: any) =>
                onAchievementUnlocked?.(a),
              );
            }
          } catch (e) {
            console.error("Error finalizando attempt", e);
          }
        }
      };
      finishGame();
    }
  }, [filledCells, isGameStarted, isComplete, attemptId, mistakes]);

  // --- Helpers ---

  const eraseCell = useCallback(() => {
    if (!selectedCell || isComplete) return;
    const { row, col } = selectedCell;
    if (board[row][col].isReadOnly) return;

    const newBoard = [...board];
    newBoard[row][col] = { ...newBoard[row][col], value: null, isError: false };
    setBoard(newBoard);
    // Nota: Si borras, filledCells debería bajar si tenía un valor correcto antes
    // Aquí habría que ajustar la lógica de filledCells si permites borrar aciertos (normalmente en apps de sudoku, si aciertas se bloquea la celda, si permites borrar, ajusta filledCells).
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
    },
  };
};
