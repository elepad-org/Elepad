import { useState, useEffect, useCallback, useRef } from "react";

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

interface UseNetGameProps {
  gridSize: number; // 5 para 5x5
}

// Direcciones: 0=arriba, 1=derecha, 2=abajo, 3=izquierda
type Direction = 0 | 1 | 2 | 3;

// Definir conexiones para cada tipo de tile (qué direcciones están conectadas)
const TILE_CONNECTIONS: Record<TileType, Direction[]> = {
  empty: [],
  endpoint: [0], // Solo arriba
  straight: [0, 2], // Arriba y abajo
  corner: [0, 1], // Arriba y derecha
  "t-junction": [0, 1, 2], // Arriba, derecha y abajo
  cross: [0, 1, 2, 3], // Todas las direcciones
};

export const useNetGame = ({ gridSize }: UseNetGameProps) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameId, setGameId] = useState<string>(Date.now().toString());
  const [centerTile, setCenterTile] = useState<number>(
    Math.floor((gridSize * gridSize) / 2),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generar un tablero aleatorio conectado
  const generateConnectedBoard = useCallback((): Tile[] => {
    const size = gridSize;
    const totalTiles = size * size;
    const newTiles: Tile[] = [];

    // 1. Generar un árbol de expansión usando DFS para garantizar conectividad
    const visited = new Set<number>();
    const stack: number[] = [];

    // Empezar desde el centro
    const center = Math.floor(totalTiles / 2);
    stack.push(center);
    visited.add(center);

    const getNeighbors = (index: number): number[] => {
      const row = Math.floor(index / size);
      const col = index % size;
      const neighbors: number[] = [];

      // Arriba, Derecha, Abajo, Izquierda
      const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];

      dirs.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
          neighbors.push(newRow * size + newCol);
        }
      });

      return neighbors;
    };

    // Construir árbol de expansión
    const edges: Array<[number, number]> = [];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const neighbors = getNeighbors(current).filter((n) => !visited.has(n));

      if (neighbors.length > 0) {
        // Elegir un vecino aleatorio
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        edges.push([current, next]);
        visited.add(next);
        stack.push(current); // Volver a poner current para explorar otros vecinos
        stack.push(next);
      }
    }

    // 3. Crear tiles basados en las conexiones
    const connections: Map<number, Set<Direction>> = new Map();

    // Inicializar conexiones vacías
    for (let i = 0; i < totalTiles; i++) {
      connections.set(i, new Set());
    }

    // Agregar conexiones del árbol de expansión
    edges.forEach(([from, to]) => {
      const fromRow = Math.floor(from / size);
      const fromCol = from % size;
      const toRow = Math.floor(to / size);
      const toCol = to % size;

      // Determinar dirección
      if (toRow < fromRow) {
        connections.get(from)!.add(0); // arriba
        connections.get(to)!.add(2); // abajo
      } else if (toRow > fromRow) {
        connections.get(from)!.add(2); // abajo
        connections.get(to)!.add(0); // arriba
      } else if (toCol > fromCol) {
        connections.get(from)!.add(1); // derecha
        connections.get(to)!.add(3); // izquierda
      } else {
        connections.get(from)!.add(3); // izquierda
        connections.get(to)!.add(1); // derecha
      }
    });

    // 4. Convertir conexiones a tipos de tiles
    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      const conns = connections.get(i)!;
      const connCount = conns.size;

      let type: TileType;

      if (connCount === 0) {
        type = "empty";
      } else if (connCount === 1) {
        type = "endpoint";
      } else if (connCount === 2) {
        const dirs = Array.from(conns).sort((a, b) => a - b);
        // Verificar si es recto o esquina
        if (
          (dirs[0] === 0 && dirs[1] === 2) ||
          (dirs[0] === 1 && dirs[1] === 3)
        ) {
          type = "straight";
        } else {
          type = "corner";
        }
      } else if (connCount === 3) {
        type = "t-junction";
      } else {
        type = "cross";
      }

      // Rotación inicial aleatoria
      const randomRotations: Rotation[] = [0, 90, 180, 270];
      const rotation =
        randomRotations[Math.floor(Math.random() * randomRotations.length)];

      newTiles.push({
        id: i,
        type,
        rotation,
        isLocked: false,
        isConnected: false,
        row,
        col,
      });
    }

    return newTiles;
  }, [gridSize]);

  // Inicializar juego
  const initializeGame = useCallback(() => {
    const newGameId = Date.now().toString();
    setGameId(newGameId);
    console.log("🆕 Nuevo juego NET iniciado con ID:", newGameId);

    setMoves(0);
    setTimeElapsed(0);
    setIsComplete(false);
    setIsGameStarted(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const newTiles = generateConnectedBoard();
    setTiles(newTiles);
    setCenterTile(Math.floor((gridSize * gridSize) / 2));
  }, [gridSize, generateConnectedBoard]);

  // Inicializar al montar
  useEffect(() => {
    initializeGame();
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

  // Calcular tiles conectados desde el centro usando BFS
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

        // Obtener conexiones del tile actual considerando su rotación
        const connections = TILE_CONNECTIONS[tile.type].map(
          (dir) => ((dir + tile.rotation / 90) % 4) as Direction,
        );

        // Para cada dirección conectada, verificar el vecino
        connections.forEach((dir) => {
          let neighborRow = currentRow;
          let neighborCol = currentCol;

          if (dir === 0)
            neighborRow--; // arriba
          else if (dir === 1)
            neighborCol++; // derecha
          else if (dir === 2)
            neighborRow++; // abajo
          else if (dir === 3) neighborCol--; // izquierda

          // Verificar límites
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

          // Verificar si el vecino conecta de vuelta
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

  // Verificar si hay loops (ciclos cerrados) en la red
  const hasLoops = useCallback(
    (currentTiles: Tile[]): boolean => {
      const size = gridSize;
      const visited = new Set<number>();

      // DFS para detectar ciclos
      const dfs = (node: number, parentNode: number): boolean => {
        visited.add(node);
        const tile = currentTiles[node];

        if (!tile || tile.type === "empty") return false;

        const currentRow = Math.floor(node / size);
        const currentCol = node % size;

        // Obtener conexiones del tile actual
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

          // Verificar límites
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

          // Verificar si el vecino conecta de vuelta
          const oppositeDir = ((dir + 2) % 4) as Direction;
          const neighborConnections = TILE_CONNECTIONS[neighborTile.type].map(
            (d) => ((d + neighborTile.rotation / 90) % 4) as Direction,
          );

          if (!neighborConnections.includes(oppositeDir)) continue;

          // Si el vecino ya fue visitado y no es el padre, hay un ciclo
          if (visited.has(neighborIndex) && neighborIndex !== parentNode) {
            return true;
          }

          // Si no ha sido visitado, continuar DFS
          if (!visited.has(neighborIndex)) {
            if (dfs(neighborIndex, node)) return true;
          }
        }

        return false;
      };

      // Empezar DFS desde el centro
      return dfs(centerTile, -1);
    },
    [gridSize, centerTile],
  );

  // Verificar si el juego está completo
  const checkCompletion = useCallback(
    (currentTiles: Tile[]): boolean => {
      // Un juego está completo si:
      // 1. Todos los tiles (excepto empty) están conectados al centro
      // 2. NO hay loops (ciclos cerrados)

      const connected = calculateConnectedTiles(currentTiles, centerTile);

      // Verificar que todos los tiles no-empty estén conectados
      const allConnected = currentTiles.every(
        (tile) => tile.type === "empty" || connected.has(tile.id),
      );

      if (!allConnected) {
        const disconnected = currentTiles.filter(
          (tile) => tile.type !== "empty" && !connected.has(tile.id),
        ).length;
        console.log(`❌ Faltan ${disconnected} tiles por conectar`);
        return false;
      }

      // Verificar que no haya loops
      const loops = hasLoops(currentTiles);

      if (loops) {
        console.log("❌ Hay loops en la red - necesitas eliminarlos");
        return false;
      }

      console.log(
        "🎉 ¡Juego completado! Todos los tiles conectados y sin loops",
      );
      return true; // Ganamos si NO hay loops
    },
    [centerTile, calculateConnectedTiles, hasLoops],
  );

  // Actualizar tiles conectados y verificar completación
  useEffect(() => {
    if (tiles.length === 0) return;

    const connected = calculateConnectedTiles(tiles, centerTile);

    // Actualizar estado de conexión
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

    // Verificar si el juego está completo
    if (isGameStarted && !isComplete) {
      const complete = checkCompletion(tiles);
      if (complete) {
        setIsComplete(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [
    tiles.map((t) => `${t.id}-${t.rotation}`).join(","),
    centerTile,
    isGameStarted,
    isComplete,
    calculateConnectedTiles,
    checkCompletion,
  ]);

  // Rotar un tile
  const rotateTile = useCallback(
    (tileId: number, direction: "clockwise" | "counterclockwise") => {
      if (!isGameStarted) {
        setIsGameStarted(true);
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

        // Recalcular tiles conectados inmediatamente
        const connected = calculateConnectedTiles(newTiles, centerTile);
        return newTiles.map((tile) => ({
          ...tile,
          isConnected: connected.has(tile.id),
        }));
      });

      setMoves((prev) => prev + 1);
    },
    [isGameStarted, calculateConnectedTiles, centerTile],
  );

  // Toggle bloqueo de un tile
  const toggleLock = useCallback((tileId: number) => {
    setTiles((prevTiles) =>
      prevTiles.map((tile) =>
        tile.id === tileId ? { ...tile, isLocked: !tile.isLocked } : tile,
      ),
    );
  }, []);

  // Resetear juego
  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Contar tiles conectados
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
    stats,
    gameId,
    centerTile,
  };
};
