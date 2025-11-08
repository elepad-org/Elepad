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
  const [solution, setSolution] = useState<Rotation[]>([]); // Guardar la solución
  const [isSolvedAutomatically, setIsSolvedAutomatically] = useState(false); // Bandera para saber si se resolvió automáticamente
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameId, setGameId] = useState<string>(Date.now().toString());
  const [centerTile, setCenterTile] = useState<number>(
    Math.floor((gridSize * gridSize) / 2),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generar un tablero aleatorio conectado (algoritmo de Simon Tatham simplificado)
  const generateConnectedBoard = useCallback((): {
    tiles: Tile[];
    solution: Rotation[];
  } => {
    const size = gridSize;
    const totalTiles = size * size;

    // Representación de direcciones como bits (igual que en el código original)
    // R=1 (derecha), U=2 (arriba), L=4 (izquierda), D=8 (abajo)
    const R = 0x01,
      U = 0x02,
      L = 0x04,
      D = 0x08;

    // Tiles: cada casilla tiene un número que representa sus conexiones en bits
    const tiles = new Array(totalTiles).fill(0);

    // Posibilidades: lista de {x, y, direction} que representan extensiones posibles
    interface Possibility {
      x: number;
      y: number;
      direction: number;
    }
    const possibilities: Possibility[] = [];

    const getOpposite = (dir: number): number => {
      // Dirección opuesta: R<->L, U<->D
      if (dir === R) return L;
      if (dir === L) return R;
      if (dir === U) return D;
      if (dir === D) return U;
      return 0;
    };

    const getNeighborCoords = (
      x: number,
      y: number,
      dir: number,
    ): { x: number; y: number } | null => {
      let nx = x,
        ny = y;
      if (dir === R) nx++;
      else if (dir === L) nx--;
      else if (dir === U) ny--;
      else if (dir === D) ny++;

      // Verificar límites (sin wrapping)
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) return null;
      return { x: nx, y: ny };
    };

    const countConnections = (tile: number): number => {
      let count = 0;
      if (tile & R) count++;
      if (tile & U) count++;
      if (tile & L) count++;
      if (tile & D) count++;
      return count;
    };

    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2);

    // IMPORTANTE: El centro SIEMPRE debe ser endpoint (fuente única)
    // Elegir UNA dirección aleatoria desde el centro
    const centerDirections = [];
    if (cx + 1 < size) centerDirections.push(R);
    if (cy - 1 >= 0) centerDirections.push(U);
    if (cx - 1 >= 0) centerDirections.push(L);
    if (cy + 1 < size) centerDirections.push(D);

    // Elegir solo UNA dirección para que el centro sea endpoint
    const centerDir =
      centerDirections[Math.floor(Math.random() * centerDirections.length)];
    possibilities.push({ x: cx, y: cy, direction: centerDir });

    // Algoritmo principal
    while (possibilities.length > 0) {
      // Elegir una posibilidad al azar
      const i = Math.floor(Math.random() * possibilities.length);
      const { x: x1, y: y1, direction: d1 } = possibilities[i];
      possibilities.splice(i, 1);

      // Calcular el tile vecino
      const neighbor = getNeighborCoords(x1, y1, d1);
      if (!neighbor) continue;

      const { x: x2, y: y2 } = neighbor;
      const d2 = getOpposite(d1);

      // Conectar ambos tiles
      tiles[y1 * size + x1] |= d1;

      // Solo conectar si el vecino está vacío
      if (tiles[y2 * size + x2] !== 0) continue;

      tiles[y2 * size + x2] |= d2;

      // Si acabamos de crear un T-piece (3 conexiones), eliminar la 4ta posibilidad
      if (countConnections(tiles[y1 * size + x1]) === 3) {
        const missingDir = (R | U | L | D) ^ tiles[y1 * size + x1];
        const idx = possibilities.findIndex(
          (p) => p.x === x1 && p.y === y1 && p.direction === missingDir,
        );
        if (idx >= 0) possibilities.splice(idx, 1);
      }

      // Eliminar posibilidades que apuntan al tile que acabamos de llenar
      for (let dir of [R, U, L, D]) {
        const n = getNeighborCoords(x2, y2, dir);
        if (!n) continue;

        const oppDir = getOpposite(dir);
        const idx = possibilities.findIndex(
          (p) => p.x === n.x && p.y === n.y && p.direction === oppDir,
        );
        if (idx >= 0) possibilities.splice(idx, 1);
      }

      // Agregar nuevas posibilidades desde el tile nuevo
      for (let dir of [R, U, L, D]) {
        if (dir === d2) continue; // Ya tenemos esta conexión

        const n = getNeighborCoords(x2, y2, dir);
        if (!n) continue;

        // No agregar si crearía un loop
        if (tiles[n.y * size + n.x] !== 0) continue;

        possibilities.push({ x: x2, y: y2, direction: dir });
      }
    }

    // Convertir de representación de bits a nuestros Tile objects
    const finalTiles: Tile[] = [];
    const solutionRotations: Rotation[] = [];

    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      const tileBits = tiles[i];
      const connCount = countConnections(tileBits);

      let type: TileType;
      let correctRotation: Rotation = 0;

      // Determinar tipo y rotación correcta
      if (connCount === 0) {
        type = "endpoint";
        correctRotation = 0;
      } else if (connCount === 1) {
        type = "endpoint";
        // Calcular rotación: endpoint base apunta arriba (U=2)
        if (tileBits & R) correctRotation = 90;
        else if (tileBits & D) correctRotation = 180;
        else if (tileBits & L) correctRotation = 270;
        else correctRotation = 0; // U
      } else if (connCount === 2) {
        // Determinar si es straight o corner
        if (
          (tileBits & (U | D)) === (U | D) ||
          (tileBits & (R | L)) === (R | L)
        ) {
          type = "straight";
          correctRotation = (tileBits & (R | L)) === (R | L) ? 90 : 0;
        } else {
          type = "corner";
          // Corner base es U|R
          if ((tileBits & (U | R)) === (U | R)) correctRotation = 0;
          else if ((tileBits & (R | D)) === (R | D)) correctRotation = 90;
          else if ((tileBits & (D | L)) === (D | L)) correctRotation = 180;
          else correctRotation = 270; // U|L
        }
      } else if (connCount === 3) {
        type = "t-junction";
        // T-junction base es U|R|D (sin L)
        if (!(tileBits & L)) correctRotation = 0;
        else if (!(tileBits & U)) correctRotation = 90;
        else if (!(tileBits & R)) correctRotation = 180;
        else correctRotation = 270; // sin D
      } else {
        // No debería haber 4 conexiones
        type = "t-junction";
        correctRotation = 0;
      }

      solutionRotations.push(correctRotation);

      // Rotar aleatoriamente para el puzzle
      const randomRotations: Rotation[] = [0, 90, 180, 270];
      const randomRotation =
        randomRotations[Math.floor(Math.random() * randomRotations.length)];

      finalTiles.push({
        id: i,
        type,
        rotation: randomRotation,
        isLocked: false,
        isConnected: false,
        row,
        col,
      });
    }

    const endpointCount = finalTiles.filter(
      (t) => t.type === "endpoint",
    ).length;
    console.log(`✓ Tablero generado con ${endpointCount} endpoints`);

    return { tiles: finalTiles, solution: solutionRotations };
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
    setIsSolvedAutomatically(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const { tiles: newTiles, solution: newSolution } = generateConnectedBoard();
    setTiles(newTiles);
    setSolution(newSolution);
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

  // Resolver juego automáticamente
  const solveGame = useCallback(() => {
    if (solution.length === 0) {
      console.warn("No hay solución disponible");
      return;
    }

    console.log("🤖 Resolviendo juego automáticamente...");
    console.log("Solución guardada:", solution);

    setTiles((prevTiles) => {
      const solvedTiles = prevTiles.map((tile) => {
        // Usar tile.id como índice para obtener la rotación correcta
        const correctRotation = solution[tile.id];
        console.log(
          `Tile ${tile.id}: ${tile.rotation}° -> ${correctRotation}°`,
        );

        return {
          ...tile,
          rotation: correctRotation,
          isLocked: false,
        };
      });

      // Recalcular tiles conectados
      const connected = calculateConnectedTiles(solvedTiles, centerTile);
      const finalTiles = solvedTiles.map((tile) => ({
        ...tile,
        isConnected: connected.has(tile.id),
      }));

      console.log(
        "Tiles resueltos:",
        finalTiles.map((t) => `${t.id}:${t.rotation}°`).join(", "),
      );
      return finalTiles;
    });

    setIsSolvedAutomatically(true);
    setIsComplete(true);
    setIsGameStarted(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [solution, calculateConnectedTiles, centerTile]);

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
    solveGame,
    stats,
    gameId,
    centerTile,
    isSolvedAutomatically,
  };
};
