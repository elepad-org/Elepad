import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { NewMemoryPuzzle, NewNetPuzzle, GameListItem } from "./schema";

/**
 * Funciones para crear Sudoku
 * Puede extenderse a puzzles en general
 * TODO: Ver si es mejor crear 10-15 niveles y pedirlos desde supabase en vez de generar nuevos por cada request
 */
const createEmptyGrid = () => Array.from({ length: 9 }, () => Array(9).fill(0));

const isValidMove = (
  grid: number[][],
  row: number,
  col: number,
  num: number,
) => {
  // Verificar fila y columna
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num) return false;
  }

  // Verificar cuadrante 3x3
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (grid: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        // Intentar números del 1 al 9 en orden aleatorio para generar tableros distintos
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
          () => Math.random() - 0.5,
        );

        for (const num of nums) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0; // Backtracking
          }
        }
        return false;
      }
    }
  }
  return true;
};

// Helper para llenar un cuadro 3x3 diagonal (no requiere validación compleja)
const fillBox = (grid: number[][], row: number, col: number) => {
  let num: number;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(grid, row, col, num));
      grid[row + i][col + j] = num;
    }
  }
};

const generateSudoku = (difficulty: "easy" | "medium" | "hard") => {
  // 1. Generar grid resuelto
  const solutionGrid = createEmptyGrid();

  // Llenar las diagonales principales primero (son independientes) para optimizar
  // Esto asegura aleatoriedad antes de correr el solver
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(solutionGrid, i, i);
  }

  // Resolver el resto
  solveSudoku(solutionGrid);

  // 2. Crear copia para el puzzle (tablero inicial)
  const initialGrid = solutionGrid.map((row) => [...row]);

  // 3. Determinar cuántas celdas borrar según dificultad
  let attempts = 0;
  switch (difficulty) {
    case "easy":
      attempts = 30;
      break; // Quedan ~51 pistas
    case "medium":
      attempts = 45;
      break; // Quedan ~36 pistas
    case "hard":
      attempts = 55;
      break; // Quedan ~26 pistas
    default:
      attempts = 30;
  }

  // 4. Remover números
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    while (initialGrid[row][col] === 0) {
      row = Math.floor(Math.random() * 9);
      col = Math.floor(Math.random() * 9);
    }
    initialGrid[row][col] = 0; // 0 representa celda vacía
    attempts--;
  }

  return { initialGrid, solutionGrid };
};

const isSafeInBox = (
  grid: number[][],
  rowStart: number,
  colStart: number,
  num: number,
) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};

export class PuzzleService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Lista todos los juegos disponibles agrupados por tipo
   */
  async listAvailableGames(): Promise<GameListItem[]> {
    // Por ahora retornamos un listado hardcodeado de los juegos disponibles
    // En el futuro, esto podría venir de la DB
    const games: GameListItem[] = [
      {
        gameType: "memory",
        gameName: "memory_match",
        displayName: "Juego de Memoria",
        description: "Encuentra todas las parejas de cartas idénticas",
        icon: "🧠",
        isAvailable: true,
      },
      {
        gameType: "logic",
        gameName: "net",
        displayName: "NET",
        description: "Conecta toda la red girando las casillas",
        icon: "🌐",
        isAvailable: true,
      },
      {
        gameType: "logic",
        gameName: "lights_out",
        displayName: "Lights Out",
        description: "Apaga todas las luces del tablero",
        icon: "💡",
        isAvailable: false,
        comingSoon: true,
      },
      {
        gameType: "logic",
        gameName: "sudoku",
        displayName: "Sudoku",
        description: "Completa el tablero con los números del 1 al 9",
        icon: "🔢",
        isAvailable: false,
        comingSoon: true,
      },
    ];

    return games;
  }

  /**
   * Obtiene los detalles de un juego específico
   */
  async getGameDetails(gameName: string) {
    const games = await this.listAvailableGames();
    const game = games.find((g) => g.gameName === gameName);

    if (!game) {
      throw new ApiException(404, "Juego no encontrado");
    }

    return game;
  }

  /**
   * Obtiene un puzzle por ID con sus detalles específicos del tipo de juego
   */
  async getPuzzleById(puzzleId: string) {
    // Obtener el puzzle base
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .select("*")
      .eq("id", puzzleId)
      .single();

    if (puzzleError) {
      throw new ApiException(500, "Error al obtener el puzzle", puzzleError);
    }

    if (!puzzle) {
      throw new ApiException(404, "Puzzle no encontrado");
    }

    // Obtener detalles específicos según el tipo
    let memoryGame = null;
    let logicGame = null;
    let sudokuGame = null;

    if (puzzle.gameType === "memory") {
      const { data, error } = await this.supabase
        .from("memoryGames")
        .select("*")
        .eq("puzzleId", puzzleId)
        .single();

      if (error) {
        throw new ApiException(
          500,
          "Error al obtener detalles del juego de memoria",
          error,
        );
      }
      memoryGame = data;
    } else if (puzzle.gameType === "logic") {
      const { data, error } = await this.supabase
        .from("logicGames")
        .select("*")
        .eq("puzzleId", puzzleId)
        .single();

      if (error) {
        throw new ApiException(
          500,
          "Error al obtener detalles del juego de lógica",
          error,
        );
      }
      logicGame = data;
    } else if (puzzle.gameType === "attention") {
      console.log("You shouldn't be here...");
    } else if (puzzle.gameType === "calculation") {
      const { data, error } = await this.supabase
        .from("sudokuGames")
        .select("*")
        .eq("puzzleId", puzzleId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found (es OK si no existe)
        throw new ApiException(
          500,
          "Error al obtener detalles del sudoku",
          error,
        );
      }
      sudokuGame = data;
    }

    return {
      puzzle,
      memoryGame,
      logicGame,
      sudokuGame,
    };
  }

  /**
   * Crea un nuevo puzzle de memoria aleatorio
   */
  async createMemoryPuzzle(payload: NewMemoryPuzzle) {
    const { title, difficulty, rows, cols } = payload;

    // Generar símbolos aleatorios para el juego
    const totalPairs = (rows * cols) / 2;
    const allSymbols = [
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
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦆",
      "🦅",
      "🦉",
      "🦇",
      "🐺",
    ];

    // Seleccionar símbolos aleatorios
    const selectedSymbols = allSymbols
      .sort(() => Math.random() - 0.5)
      .slice(0, totalPairs);

    // Crear layout: cada símbolo aparece dos veces
    const layout: number[] = [];
    selectedSymbols.forEach((_, index) => {
      layout.push(index, index);
    });
    // Mezclar el layout
    layout.sort(() => Math.random() - 0.5);

    // Crear el puzzle base
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .insert({
        gameType: "memory",
        gameName: "memory_match",
        title: title || `Memoria ${rows}x${cols}`,
        difficulty: difficulty || Math.ceil((rows * cols) / 8),
      })
      .select()
      .single();

    if (puzzleError) {
      throw new ApiException(500, "Error al crear el puzzle", puzzleError);
    }

    // Crear los detalles del juego de memoria
    const { data: memoryGame, error: memoryError } = await this.supabase
      .from("memoryGames")
      .insert({
        puzzleId: puzzle.id,
        rows,
        cols,
        symbols: selectedSymbols,
        layout,
      })
      .select()
      .single();

    if (memoryError) {
      // Rollback: eliminar el puzzle si falla
      await this.supabase.from("puzzles").delete().eq("id", puzzle.id);
      throw new ApiException(
        500,
        "Error al crear el juego de memoria",
        memoryError,
      );
    }

    return {
      puzzle,
      memoryGame,
      logicGame: null,
      sudokuGame: null,
    };
  }

  /**
   * Crea un nuevo puzzle de Sudoku
   */
  async createSudokuPuzzle(payload: {
    title?: string;
    difficulty: "easy" | "medium" | "hard";
  }) {
    const { title, difficulty } = payload;

    // Usa los helpers de arriba
    const { initialGrid, solutionGrid } = generateSudoku(difficulty);

    // Crea el puzzle
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .insert({
        gameType: "logic",
        gameName: "sudoku",
        title:
          title ||
          `Sudoku ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        difficulty: difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1,
      })
      .select()
      .single();

    if (puzzleError) {
      throw new ApiException(
        500,
        "Error al crear el puzzle de sudoku",
        puzzleError,
      );
    }

    const { data: sudokuGame, error: sudokuError } = await this.supabase
      .from("sudokuGames")
      .insert({
        puzzleId: puzzle.id,
        rows: 9,
        cols: 9,
        given: initialGrid,
        solution: solutionGrid,
      })
      .select()
      .single();

    if (sudokuError) {
      // Rollback: eliminar el puzzle si falla la inserción de los detalles
      await this.supabase.from("puzzles").delete().eq("id", puzzle.id);
      console.error("Error detallado sudoku:", sudokuError);
      throw new ApiException(
        500,
        "Error al guardar los datos del Sudoku",
        sudokuError,
      );
    }

    return {
      puzzle,
      sudokuGame,
      memoryGame: null,
      logicGame: null,
    };
  }

  /**
   * Lista puzzles recientes de un tipo específico
   */
  async listRecentPuzzles(
    gameType: Database["public"]["Enums"]["game_type"],
    limit = 10,
  ) {
    const { data, error } = await this.supabase
      .from("puzzles")
      .select("*")
      .eq("gameType", gameType)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      throw new ApiException(500, "Error al listar puzzles", error);
    }

    return data;
  }

  /**
   * Crea un nuevo puzzle de NET (juego de conectar red)
   * Genera un tablero aleatorio conectado usando algoritmo de árbol de expansión
   */
  async createNetPuzzle(payload: NewNetPuzzle) {
    const { title, difficulty, gridSize } = payload;

    // Tipos de tiles en NET
    // 0 = endpoint (1 conexión), 1 = straight (2 conexiones opuestas)
    // 2 = corner (2 conexiones adyacentes), 3 = t-junction (3 conexiones)
    type TileType = 0 | 1 | 2 | 3;
    // Direction: 0=arriba, 1=derecha, 2=abajo, 3=izquierda
    type Rotation = 0 | 90 | 180 | 270;

    // Representación de direcciones como bits
    const R = 0x01; // derecha
    const U = 0x02; // arriba
    const L = 0x04; // izquierda
    const D = 0x08; // abajo

    const size = gridSize;
    const totalTiles = size * size;
    const tiles = new Array(totalTiles).fill(0);

    interface Possibility {
      x: number;
      y: number;
      direction: number;
    }
    const possibilities: Possibility[] = [];

    const getOpposite = (dir: number): number => {
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

    // Empezar desde el centro
    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2);

    // El centro debe ser endpoint (una sola dirección)
    const centerDirections = [];
    if (cx + 1 < size) centerDirections.push(R);
    if (cy - 1 >= 0) centerDirections.push(U);
    if (cx - 1 >= 0) centerDirections.push(L);
    if (cy + 1 < size) centerDirections.push(D);

    const centerDir =
      centerDirections[Math.floor(Math.random() * centerDirections.length)]!;
    possibilities.push({ x: cx, y: cy, direction: centerDir });

    // Algoritmo principal: construir árbol de expansión
    while (possibilities.length > 0) {
      const i = Math.floor(Math.random() * possibilities.length);
      const { x: x1, y: y1, direction: d1 } = possibilities[i]!;
      possibilities.splice(i, 1);

      const neighbor = getNeighborCoords(x1, y1, d1);
      if (!neighbor) continue;

      const { x: x2, y: y2 } = neighbor;
      const d2 = getOpposite(d1);

      tiles[y1 * size + x1] |= d1;

      if (tiles[y2 * size + x2] !== 0) continue;

      tiles[y2 * size + x2] |= d2;

      // Si creamos T-junction (3 conexiones), eliminar 4ta posibilidad
      if (countConnections(tiles[y1 * size + x1]) === 3) {
        const missingDir = (R | U | L | D) ^ tiles[y1 * size + x1];
        const idx = possibilities.findIndex(
          (p) => p.x === x1 && p.y === y1 && p.direction === missingDir,
        );
        if (idx >= 0) possibilities.splice(idx, 1);
      }

      // Eliminar posibilidades que apuntan al tile recién llenado
      for (const dir of [R, U, L, D]) {
        const n = getNeighborCoords(x2, y2, dir);
        if (!n) continue;

        const oppDir = getOpposite(dir);
        const idx = possibilities.findIndex(
          (p) => p.x === n.x && p.y === n.y && p.direction === oppDir,
        );
        if (idx >= 0) possibilities.splice(idx, 1);
      }

      // Agregar nuevas posibilidades desde el tile nuevo
      for (const dir of [R, U, L, D]) {
        if (dir === d2) continue;

        const n = getNeighborCoords(x2, y2, dir);
        if (!n) continue;

        if (tiles[n.y * size + n.x] !== 0) continue;

        possibilities.push({ x: x2, y: y2, direction: dir });
      }
    }

    // Convertir tiles a formato [tipo, rotación, tipo, rotación, ...]
    const startState: number[] = [];
    const solution: number[] = []; // Guardar la solución (rotaciones correctas)

    for (let i = 0; i < totalTiles; i++) {
      const tileBits = tiles[i];
      const connCount = countConnections(tileBits);

      let type: TileType;
      let correctRotation: Rotation = 0;

      if (connCount === 0) {
        type = 0; // endpoint
        correctRotation = 0;
      } else if (connCount === 1) {
        type = 0; // endpoint
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
          type = 1; // straight
          correctRotation = (tileBits & (R | L)) === (R | L) ? 90 : 0;
        } else {
          type = 2; // corner
          if ((tileBits & (U | R)) === (U | R)) correctRotation = 0;
          else if ((tileBits & (R | D)) === (R | D)) correctRotation = 90;
          else if ((tileBits & (D | L)) === (D | L)) correctRotation = 180;
          else correctRotation = 270; // U|L
        }
      } else if (connCount === 3) {
        type = 3; // t-junction
        if (!(tileBits & L)) correctRotation = 0;
        else if (!(tileBits & U)) correctRotation = 90;
        else if (!(tileBits & R)) correctRotation = 180;
        else correctRotation = 270;
      } else {
        type = 3;
        correctRotation = 270;
      }

      // Guardar la solución (rotación correcta) antes de mezclar
      solution.push(type, correctRotation);

      // Luego rotar aleatoriamente para el puzzle inicial
      const randomRotations: Rotation[] = [0, 90, 180, 270];
      const randomRotation =
        randomRotations[Math.floor(Math.random() * randomRotations.length)]!;

      // startState almacena [tipo, rotaciónAleatoria] para cada tile
      startState.push(type, randomRotation);
    }

    // Crear el puzzle base
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .insert({
        gameType: "logic",
        gameName: "net",
        title: title || `NET ${size}x${size}`,
        difficulty: difficulty || Math.ceil(size / 2),
      })
      .select()
      .single();

    if (puzzleError) {
      throw new ApiException(500, "Error al crear el puzzle", puzzleError);
    }

    // Crear los detalles del juego de lógica (NET)
    const { data: logicGame, error: logicError } = await this.supabase
      .from("logicGames")
      .insert({
        puzzleId: puzzle.id,
        rows: size,
        cols: size,
        startState,
        solution, // Agregar la solución
      })
      .select()
      .single();

    if (logicError) {
      // Rollback: eliminar el puzzle si falla
      await this.supabase.from("puzzles").delete().eq("id", puzzle.id);
      throw new ApiException(
        500,
        "Error al crear el juego de lógica",
        logicError,
      );
    }

    return {
      puzzle,
      memoryGame: null,
      logicGame,
      sudokuGame: null,
    };
  }

  /**
   * Crea un nuevo puzzle de atención (focus)
   */
  async createFocusPuzzle(payload: { rounds?: number }) {
    const { rounds } = payload;
    console.log(rounds);

    // Crear el puzzle base
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .insert({
        gameType: "attention",
        gameName: "focus",
        title: `Focus ${rounds ?? 10} rondas`,
        difficulty: 1,
      })
      .select()
      .single();

    if (puzzleError) {
      throw new ApiException(500, "Error al crear el puzzle", puzzleError);
    }

    // Actualmente no tenemos una tabla específica para detalles de attention,
    // así que devolvemos únicamente el puzzle creado y dejamos los detalles en null.
    return {
      puzzle,
      memoryGame: null,
      logicGame: null,
      sudokuGame: null,
    };
  }
}
