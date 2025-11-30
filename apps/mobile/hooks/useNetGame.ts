import { useState, useEffect, useCallback, useRef } from "react";
import {
  usePostPuzzlesNet,
  usePostAttemptsStart,
  usePostAttemptsAttemptIdFinish,
  usePostAchievementsCheckAttemptId,
} from "@elepad/api-client";

export type TileType =
  | "empty"
  | "endpoint"
  | "straight"
  | "corner"
  | "t-junction"
  | "cross";
export type Rotation = 0 | 90 | 180 | 270;

export interface Tile {
  id: number;
  type: TileType;
  rotation: Rotation;
  isLocked: boolean;
  isConnected: boolean;
  row: number;
  col: number;
}

export interface GameStats {
  moves: number;
  timeElapsed: number;
  isComplete: boolean;
  connectedTiles: number;
  totalTiles: number;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  icon?: string;
  description?: string;
}

interface UseNetGameProps {
  gridSize: number;
  onAchievementUnlocked?: (achievement: UnlockedAchievement) => void;
}

type Direction = 0 | 1 | 2 | 3;

const TILE_CONNECTIONS: Record<TileType, Direction[]> = {
  empty: [],
  endpoint: [0],
  straight: [0, 2],
  corner: [0, 1],
  "t-junction": [0, 1, 2],
  cross: [0, 1, 2, 3],
};

const TILE_TYPE_MAP: Record<number, TileType> = {
  0: "endpoint",
  1: "straight",
  2: "corner",
  3: "t-junction",
};

export const useNetGame = ({
  gridSize,
  onAchievementUnlocked,
}: UseNetGameProps) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameId, setGameId] = useState<string>(Date.now().toString());
  const [centerTile, setCenterTile] = useState<number>(
    Math.floor((gridSize * gridSize) / 2),
  );
  const [isSolvedAutomatically, setIsSolvedAutomatically] = useState(false);
  const [solution, setSolution] = useState<number[]>([]); // Guardar la solución del backend

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedAttempt = useRef(false);
  const isStartingAttempt = useRef(false);

  const createPuzzle = usePostPuzzlesNet();
  const startAttempt = usePostAttemptsStart();
  const finishAttempt = usePostAttemptsAttemptIdFinish();
  const checkAchievements = usePostAchievementsCheckAttemptId();

  // Flag para evitar múltiples inicializaciones
  const hasInitialized = useRef(false);

  const initializeGame = useCallback(async () => {
    const newGameId = Date.now().toString();
    setGameId(newGameId);
    console.log("🆕 Nuevo juego NET iniciado con ID:", newGameId);

    setMoves(0);
    setTimeElapsed(0);
    setIsComplete(false);
    setIsGameStarted(false);
    setAttemptId(null);
    setPuzzleId(null);
    setUnlockedAchievements([]);
    setIsSolvedAutomatically(false);
    hasFinishedAttempt.current = false;
    isStartingAttempt.current = false;
    setIsLoading(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;

    try {
      console.log("🌐 Llamando a POST /puzzles/net con gridSize:", gridSize);

      const puzzleData = await createPuzzle.mutateAsync({
        data: {
          gridSize,
        },
      });

      console.log("📦 Datos recibidos del API:", puzzleData);

      if (!puzzleData) {
        console.error("❌ Respuesta vacía del API");
        throw new Error("Failed to create NET puzzle");
      }

      const responseData = "data" in puzzleData ? puzzleData.data : puzzleData;

      if (!responseData || typeof responseData !== "object") {
        console.error("❌ Datos de respuesta inválidos");
        throw new Error("Invalid response data");
      }

      const { puzzle, logicGame } = responseData as {
        puzzle: { id: string };
        logicGame: {
          startState: number[];
          solution?: number[];
          rows: number;
          cols: number;
        };
      };

      if (!logicGame) {
        console.error("❌ No hay datos de logicGame en la respuesta");
        throw new Error("No logic game data received");
      }

      console.log("✅ Puzzle NET creado exitosamente:", puzzle.id);
      setPuzzleId(puzzle.id);

      const { startState, solution: solutionData, rows, cols } = logicGame;

      // Guardar la solución si está disponible
      if (solutionData && solutionData.length > 0) {
        setSolution(solutionData);
        console.log("💡 Solución guardada:", solutionData.length / 2, "tiles");
      }

      const newTiles: Tile[] = [];

      for (let i = 0; i < rows * cols; i++) {
        const tileTypeNum = startState[i * 2];
        const rotation = startState[i * 2 + 1] as Rotation;
        const type = TILE_TYPE_MAP[tileTypeNum] || "endpoint";

        newTiles.push({
          id: i,
          type,
          rotation,
          isLocked: false,
          isConnected: false,
          row: Math.floor(i / cols),
          col: i % cols,
        });
      }

      setTiles(newTiles);
      setCenterTile(Math.floor((rows * cols) / 2));
      setIsLoading(false);

      console.log("✅ Tablero NET inicializado con", newTiles.length, "tiles");
    } catch (error) {
      console.error("❌ Error al inicializar juego NET:", error);
      setIsLoading(false);
    }
  }, [gridSize, createPuzzle]);

  // Inicializar el juego solo una vez cuando el componente se monta
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeGame();
    }
  }, []); // Array vacío = solo se ejecuta una vez al montar

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

  const calculateConnectedTiles = useCallback(
    (currentTiles: Tile[], center: number): Set<number> => {
      const connected = new Set<number>();
      const queue: number[] = [center];
      connected.add(center);

      const size = gridSize;

      while (queue.length > 0) {
        const current = queue.shift()!;
        const tile = currentTiles[current];
        if (!tile || tile.type === "empty") continue;

        const currentRow = Math.floor(current / size);
        const currentCol = current % size;

        const connections = TILE_CONNECTIONS[tile.type].map(
          (dir) => ((dir + tile.rotation / 90) % 4) as Direction,
        );

        connections.forEach((dir) => {
          let neighborRow = currentRow;
          let neighborCol = currentCol;

          if (dir === 0) neighborRow--;
          else if (dir === 1) neighborCol++;
          else if (dir === 2) neighborRow++;
          else if (dir === 3) neighborCol--;

          if (
            neighborRow < 0 ||
            neighborRow >= size ||
            neighborCol < 0 ||
            neighborCol >= size
          ) {
            return;
          }

          const neighborIndex = neighborRow * size + neighborCol;
          if (connected.has(neighborIndex)) return;

          const neighborTile = currentTiles[neighborIndex];
          if (!neighborTile || neighborTile.type === "empty") return;

          const oppositeDir = ((dir + 2) % 4) as Direction;
          const neighborConnections = TILE_CONNECTIONS[neighborTile.type].map(
            (d) => ((d + neighborTile.rotation / 90) % 4) as Direction,
          );

          if (neighborConnections.includes(oppositeDir)) {
            connected.add(neighborIndex);
            queue.push(neighborIndex);
          }
        });
      }

      return connected;
    },
    [gridSize],
  );

  const hasLoops = useCallback(
    (currentTiles: Tile[]): boolean => {
      const size = gridSize;
      const visited = new Set<number>();

      const dfs = (node: number, parentNode: number): boolean => {
        visited.add(node);
        const tile = currentTiles[node];

        if (!tile || tile.type === "empty") return false;

        const currentRow = Math.floor(node / size);
        const currentCol = node % size;

        const connections = TILE_CONNECTIONS[tile.type].map(
          (dir) => ((dir + tile.rotation / 90) % 4) as Direction,
        );

        for (const dir of connections) {
          let neighborRow = currentRow;
          let neighborCol = currentCol;

          if (dir === 0) neighborRow--;
          else if (dir === 1) neighborCol++;
          else if (dir === 2) neighborRow++;
          else if (dir === 3) neighborCol--;

          if (
            neighborRow < 0 ||
            neighborRow >= size ||
            neighborCol < 0 ||
            neighborCol >= size
          ) {
            continue;
          }

          const neighborIndex = neighborRow * size + neighborCol;
          const neighborTile = currentTiles[neighborIndex];

          if (!neighborTile || neighborTile.type === "empty") continue;

          const oppositeDir = ((dir + 2) % 4) as Direction;
          const neighborConnections = TILE_CONNECTIONS[neighborTile.type].map(
            (d) => ((d + neighborTile.rotation / 90) % 4) as Direction,
          );

          if (!neighborConnections.includes(oppositeDir)) continue;

          if (visited.has(neighborIndex) && neighborIndex !== parentNode) {
            return true;
          }

          if (!visited.has(neighborIndex)) {
            if (dfs(neighborIndex, node)) return true;
          }
        }

        return false;
      };

      return dfs(centerTile, -1);
    },
    [gridSize, centerTile],
  );

  const checkCompletion = useCallback(
    (currentTiles: Tile[]): boolean => {
      const connected = calculateConnectedTiles(currentTiles, centerTile);

      const allConnected = currentTiles.every(
        (tile) => tile.type === "empty" || connected.has(tile.id),
      );

      if (!allConnected) {
        return false;
      }

      const loops = hasLoops(currentTiles);

      if (loops) {
        return false;
      }

      console.log(
        "🎉 ¡Juego NET completado! Todos los tiles conectados y sin loops",
      );
      return true;
    },
    [centerTile, calculateConnectedTiles, hasLoops],
  );

  const handleStartAttempt = useCallback(async () => {
    if (!puzzleId || isStartingAttempt.current || attemptId) {
      return;
    }

    isStartingAttempt.current = true;
    startTimeRef.current = Date.now();

    try {
      console.log("🚀 Iniciando intento para puzzle:", puzzleId);

      const response = await startAttempt.mutateAsync({
        data: {
          puzzleId,
          gameType: "logic",
        },
      });

      const responseData = "data" in response ? response.data : response;
      const attemptIdData = responseData as { id: string };

      console.log("✅ Intento iniciado:", attemptIdData.id);
      setAttemptId(attemptIdData.id);
    } catch (error) {
      console.error("❌ Error al iniciar intento:", error);
      isStartingAttempt.current = false;
    }
  }, [puzzleId, attemptId, startAttempt]);

  const handleFinishAttempt = useCallback(
    async (wasAutoSolved: boolean = false) => {
      if (!attemptId || hasFinishedAttempt.current || !startTimeRef.current) {
        console.log("⏭️ Saltando finalización de intento");
        return;
      }

      hasFinishedAttempt.current = true;
      const endTime = Date.now();
      const durationMs = endTime - startTimeRef.current;

      try {
        console.log("🏁 Finalizando intento:", {
          attemptId,
          moves,
          durationMs,
          success: true,
          autoSolved: wasAutoSolved,
        });

        const finishResponse = await finishAttempt.mutateAsync({
          attemptId,
          data: {
            success: true,
            moves,
            durationMs,
            // Si fue resuelto automáticamente, forzar score a 0 y agregar meta
            score: wasAutoSolved ? 0 : undefined, // El backend calculará el score si no se provee
            meta: wasAutoSolved
              ? { autoSolved: true, solvedAt: new Date().toISOString() }
              : undefined,
          },
        });

        console.log("✅ Intento finalizado exitosamente");

        // El backend automáticamente verifica logros y los devuelve en la respuesta
        if (
          !wasAutoSolved &&
          finishResponse.unlockedAchievements &&
          finishResponse.unlockedAchievements.length > 0
        ) {
          console.log(
            "🎉 Logros desbloqueados:",
            finishResponse.unlockedAchievements,
          );
          setUnlockedAchievements(
            finishResponse.unlockedAchievements as UnlockedAchievement[],
          );

          finishResponse.unlockedAchievements.forEach((achievement: any) => {
            onAchievementUnlocked?.(achievement);
          });
        } else if (!wasAutoSolved) {
          console.log("ℹ️ No se desbloquearon nuevos logros");
        }
      } catch (error) {
        console.error("❌ Error al finalizar intento:", error);
        hasFinishedAttempt.current = false;
      }
    },
    [attemptId, moves, finishAttempt, onAchievementUnlocked],
  );

  useEffect(() => {
    if (tiles.length === 0) return;

    const connected = calculateConnectedTiles(tiles, centerTile);

    setTiles((prevTiles) => {
      const needsUpdate = prevTiles.some(
        (tile) => tile.isConnected !== connected.has(tile.id),
      );

      if (!needsUpdate) return prevTiles;

      return prevTiles.map((tile) => ({
        ...tile,
        isConnected: connected.has(tile.id),
      }));
    });

    // Solo verificar completitud si el juego está activo y NO fue resuelto automáticamente
    if (isGameStarted && !isComplete && !isSolvedAutomatically) {
      const complete = checkCompletion(tiles);
      if (complete) {
        setIsComplete(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Juego completado de forma natural (jugando normalmente)
        handleFinishAttempt(false);
      }
    }
  }, [
    tiles.map((t) => `${t.id}-${t.rotation}`).join(","),
    centerTile,
    isGameStarted,
    isComplete,
    isSolvedAutomatically, // Agregar esta dependencia
    calculateConnectedTiles,
    checkCompletion,
    handleFinishAttempt,
  ]);

  const rotateTile = useCallback(
    (tileId: number, direction: "clockwise" | "counterclockwise") => {
      if (!isGameStarted) {
        setIsGameStarted(true);
        handleStartAttempt();
      }

      setTiles((prevTiles) => {
        const newTiles = prevTiles.map((tile) => {
          if (tile.id === tileId && !tile.isLocked) {
            const delta = direction === "clockwise" ? 90 : -90;
            const newRotation = ((tile.rotation + delta + 360) %
              360) as Rotation;
            return { ...tile, rotation: newRotation };
          }
          return tile;
        });

        const connected = calculateConnectedTiles(newTiles, centerTile);
        return newTiles.map((tile) => ({
          ...tile,
          isConnected: connected.has(tile.id),
        }));
      });

      setMoves((prev) => prev + 1);
    },
    [isGameStarted, calculateConnectedTiles, centerTile, handleStartAttempt],
  );

  const toggleLock = useCallback((tileId: number) => {
    setTiles((prevTiles) =>
      prevTiles.map((tile) =>
        tile.id === tileId ? { ...tile, isLocked: !tile.isLocked } : tile,
      ),
    );
  }, []);

  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  const solveGame = useCallback(() => {
    if (!solution || solution.length === 0) {
      console.warn("⚠️ No hay solución disponible del backend");
      return;
    }

    console.log("🔍 Aplicando solución del backend...");

    // Verificar si hay un intento activo (el usuario ya empezó a jugar)
    const hasActiveAttempt = attemptId !== null && !hasFinishedAttempt.current;

    // Primero marcar como resuelto automáticamente
    setIsSolvedAutomatically(true);

    // Aplicar la solución a los tiles
    setTiles((prevTiles) => {
      const solvedTiles = prevTiles.map((tile, index) => {
        // Obtener la rotación correcta de la solución
        const correctRotation = solution[index * 2 + 1] as Rotation;

        return {
          ...tile,
          rotation: correctRotation,
        };
      });

      return solvedTiles;
    });

    // Marcar el juego como completo después de aplicar la solución
    // Usamos un pequeño delay para que React termine de actualizar los tiles
    setTimeout(() => {
      console.log("✅ Juego completado automáticamente con la solución");
      setIsComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Si hay un intento activo, finalizarlo con score 0 y meta
      if (hasActiveAttempt) {
        console.log(
          "💾 Guardando intento con resolución automática (score: 0)",
        );
        handleFinishAttempt(true); // true = fue auto-resuelto
      } else {
        console.log(
          "⏭️ No hay intento activo, no se guarda en la base de datos",
        );
      }
    }, 150);

    console.log("✅ Solución aplicada correctamente");
  }, [solution, attemptId, handleFinishAttempt]);

  const connectedTiles = tiles.filter(
    (tile) => tile.type !== "empty" && tile.isConnected,
  ).length;
  const totalTiles = tiles.filter((tile) => tile.type !== "empty").length;

  const stats: GameStats = {
    moves,
    timeElapsed,
    isComplete,
    connectedTiles,
    totalTiles,
  };

  return {
    tiles,
    rotateTile,
    toggleLock,
    resetGame,
    solveGame,
    stats,
    gameId,
    centerTile,
    isSolvedAutomatically,
    isLoading,
    unlockedAchievements,
  };
};
