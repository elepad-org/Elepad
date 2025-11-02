import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { NewMemoryPuzzle, GameListItem } from "./schema";

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
}
