import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { StartAttempt, FinishAttempt } from "./schema";

export class AttemptService {
  constructor(private supabase: SupabaseClient<Database>) { }

  /**
   * Inicia un nuevo intento de juego
   */
  async startAttempt(userId: string, payload: StartAttempt) {
    const { puzzleId, gameType } = payload;

    // Verificar que el puzzle existe
    const { data: puzzle, error: puzzleError } = await this.supabase
      .from("puzzles")
      .select("id, gameType")
      .eq("id", puzzleId)
      .single();

    if (puzzleError || !puzzle) {
      throw new ApiException(404, "Puzzle no encontrado");
    }

    // Preparar el insert según el tipo de juego
    const insertData: Database["public"]["Tables"]["attempts"]["Insert"] = {
      userId,
      startedAt: new Date().toISOString(),
      memoryPuzzleId: gameType === "memory" ? puzzleId : null,
      logicPuzzleId: gameType === "logic" ? puzzleId : null,
      sudokuPuzzleId: gameType === "attention" ? puzzleId : null,
      isFocusGame: gameType === "reaction" ? true : false,
    };

    const { data: attempt, error: attemptError } = await this.supabase
      .from("attempts")
      .insert(insertData)
      .select()
      .single();

    if (attemptError) {
      throw new ApiException(500, "Error al crear el intento", attemptError);
    }

    return attempt;
  }

  /**
   * Finaliza un intento existente
   */
  async finishAttempt(
    attemptId: string,
    userId: string,
    payload: FinishAttempt,
  ) {
    const { success, moves, durationMs, score, meta } = payload;

    // Verificar que el intento existe y pertenece al usuario
    const { data: existingAttempt, error: checkError } = await this.supabase
      .from("attempts")
      .select(`
        id, userId, finishedAt,
        memoryPuzzleId, logicPuzzleId, sudokuPuzzleId, isFocusGame,
        memoryPuzzle:memoryGames!memoryPuzzleId(rows, cols),
        sudokuPuzzle:sudokuGames!sudokuPuzzleId(puzzle:puzzles!puzzleId(difficulty))
      `)
      .eq("id", attemptId)
      .single();

    if (checkError || !existingAttempt) {
      throw new ApiException(404, "Intento no encontrado");
    }

    if (existingAttempt.userId !== userId) {
      throw new ApiException(403, "No autorizado para finalizar este intento");
    }

    if (existingAttempt.finishedAt) {
      throw new ApiException(400, "Este intento ya fue finalizado");
    }

    console.log("[BACKEND FINISH ATTEMPT]");
    console.log(`  Attempt ID: ${attemptId}`);
    console.log(`  Success: ${success}`);
    console.log(`  Duration: ${durationMs}ms`);
    console.log(`  Moves: ${moves}`);
    console.log(`  Score from payload: ${score ?? 'null (will calculate)'}`);

    // Determinar tipo de juego y modificadores
    let gameType = 'unknown';
    let modifiers: { difficulty?: number; rows?: number; cols?: number } = {};

    if (existingAttempt.isFocusGame) {
      gameType = 'focus';
    } else if (existingAttempt.memoryPuzzleId) {
      gameType = 'memory';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mem = (existingAttempt as any).memoryPuzzle;
      if (mem) {
        modifiers = { rows: mem.rows, cols: mem.cols };
      }
    } else if (existingAttempt.logicPuzzleId) {
      gameType = 'logic'; // NET
    } else if (existingAttempt.sudokuPuzzleId) {
      gameType = 'sudoku';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sud = (existingAttempt as any).sudokuPuzzle;
      if (sud && sud.puzzle) {
        modifiers = { difficulty: sud.puzzle.difficulty };
      }
    }

    // Calcular el score si no viene en el payload
    const calculatedScore =
      score ?? this.calculateScore(durationMs, moves, success, gameType, modifiers);

    // Actualizar el intento
    const { data: attempt, error: updateError } = await this.supabase
      .from("attempts")
      .update({
        finishedAt: new Date().toISOString(),
        durationMs,
        moves,
        success,
        score: calculatedScore,
        meta: meta || null,
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (updateError) {
      throw new ApiException(500, "Error al finalizar el intento", updateError);
    }

    // Nota: La actualización de racha se hace en el handler con clientDate del cliente
    // No hacerlo aquí para evitar duplicados

    return attempt;
  }

  /**
   * Calcula el puntaje basado en tiempo, movimientos y éxito
   */
  private calculateScore(
    durationMs: number,
    moves: number,
    success: boolean,
    gameType: string,
    modifiers: { difficulty?: number; rows?: number; cols?: number } = {}
  ): number {
    if (!success) return 0;

    const durationSeconds = durationMs / 1000;
    const baseScore = 1000;
    let finalScore = 0;

    if (gameType === 'sudoku') {
      // Sudoku: Base 1000, -0.5 pts/s, -100 pts/error
      // Multiplicador: 1.0 (Fácil/Desc), 1.3 (Medio), 1.6 (Difícil)
      const timePenalty = durationSeconds * 0.5;
      const errorPenalty = moves * 100; // En Sudoku moves = mistakes

      let multiplier = 1.0;
      // Difficulty 1 = Easy, 2 = Medium, 3 = Hard
      if (modifiers.difficulty === 2) multiplier = 1.3;
      if (modifiers.difficulty === 3) multiplier = 1.6;

      finalScore = Math.max(0, baseScore - timePenalty - errorPenalty) * multiplier;

      console.log(`[SCORE] Sudoku: (1000 - ${timePenalty.toFixed(1)} - ${errorPenalty}) * ${multiplier} = ${finalScore}`);
    }
    else if (gameType === 'memory') {
      // Memory: Base 1000, -5 pts/s, -10 pts/move
      // Multiplicador: 1.0 (4x4), 1.5 (4x6)
      const timePenalty = durationSeconds * 5;
      const movePenalty = moves * 10;

      let multiplier = 1.0;
      // Si rows=4 y cols=6 => multiplicador 1.5
      if (modifiers.rows === 4 && modifiers.cols === 6) {
        multiplier = 1.5;
      }

      finalScore = Math.max(0, baseScore - timePenalty - movePenalty) * multiplier;
      console.log(`[SCORE] Memory: (1000 - ${timePenalty.toFixed(1)} - ${movePenalty}) * ${multiplier} = ${finalScore}`);

    }
    else if (gameType === 'focus') {
      // Focus: Base 1000, -15 pts/s, -100 pts/error
      const timePenalty = durationSeconds * 15;
      const errorPenalty = moves * 100; // moves = errors

      finalScore = Math.max(0, baseScore - timePenalty - errorPenalty);
      console.log(`[SCORE] Focus: 1000 - ${timePenalty.toFixed(1)} - ${errorPenalty} = ${finalScore}`);
    }
    else {
      // Default (NET y otros): Base 1000, -5 pts/s, -10 pts/mov
      const timePenalty = durationSeconds * 5;
      const movePenalty = moves * 10;

      finalScore = Math.max(0, baseScore - timePenalty - movePenalty);
      console.log(`[SCORE] Default/NET: 1000 - ${timePenalty.toFixed(1)} - ${movePenalty} = ${finalScore}`);
    }

    return Math.floor(finalScore);
  }

  /**
   * Obtiene un intento por ID
   */
  async getAttemptById(attemptId: string, userId?: string) {
    let query = this.supabase.from("attempts").select("*").eq("id", attemptId);

    if (userId) {
      query = query.eq("userId", userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new ApiException(404, "Intento no encontrado");
    }

    return data;
  }

  /**
   * Lista los intentos recientes de un usuario
   */
  async listUserAttempts(
    userId: string,
    limit = 20,
    offset = 0,
    gameType?: Database["public"]["Enums"]["game_type"],
    startDate?: string,
    endDate?: string,
  ) {
    let query = this.supabase
      .from("attempts")
      .select(
        `
        *,
        memoryPuzzle:memoryPuzzleId(puzzleId),
        logicPuzzle:logicPuzzleId(puzzleId),
        sudokuPuzzle:sudokuPuzzleId(puzzleId),
        user:userId(displayName, avatarUrl)
      `,
      )
      .eq("userId", userId)
      .order("startedAt", { ascending: false });

    // Filter by gameType if provided
    if (gameType === "memory") {
      query = query.not("memoryPuzzleId", "is", null);
    } else if (gameType === "logic") {
      query = query.not("logicPuzzleId", "is", null);
    } else if (gameType === "attention") {
      query = query.not("sudokuPuzzleId", "is", null);
    } else if (gameType === "reaction") {
      query = query.is("isFocusGame", true);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("startedAt", startDate);
    }
    if (endDate) {
      query = query.lte("startedAt", endDate);
    }

    // Apply range for pagination
    const start = offset;
    const end = offset + limit - 1;
    query = query.range(start, end) as typeof query;

    const { data, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al listar intentos", error);
    }

    // Agregar gameType a cada attempt basado en qué puzzle tiene
    const attemptsWithGameType = (data || []).map(attempt => {
      let determinedGameType = 'unknown';

      if (attempt.isFocusGame) {
        determinedGameType = 'focus';
      } else if (attempt.memoryPuzzleId) {
        determinedGameType = 'memory';
      } else if (attempt.logicPuzzleId) {
        determinedGameType = 'logic';
      } else if (attempt.sudokuPuzzleId) {
        determinedGameType = 'sudoku';
      }

      return {
        ...attempt,
        gameType: determinedGameType,
      };
    });

    return attemptsWithGameType;
  }

  /**
   * Lista los intentos recientes de todos los elder del grupo familiar del usuario
   */
  async listGroupElderAttempts(
    userId: string,
    limit = 20,
    offset = 0,
    gameType?: Database["public"]["Enums"]["game_type"],
    startDate?: string,
    endDate?: string,
  ) {
    // Primero obtener el groupId del usuario
    const { data: userData, error: userError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (userError || !userData?.groupId) {
      throw new ApiException(404, "Usuario no pertenece a un grupo familiar");
    }

    // Obtener todos los usuarios elder del grupo
    const { data: elderUsers, error: elderError } = await this.supabase
      .from("users")
      .select("id")
      .eq("groupId", userData.groupId)
      .eq("elder", true);

    if (elderError) {
      throw new ApiException(500, "Error al obtener usuarios elder", elderError);
    }

    if (!elderUsers || elderUsers.length === 0) {
      return [];
    }

    const elderIds = elderUsers.map(u => u.id);

    // Ahora buscar los intentos de todos los elder
    let query = this.supabase
      .from("attempts")
      .select(
        `
        *,
        memoryPuzzle:memoryPuzzleId(puzzleId),
        logicPuzzle:logicPuzzleId(puzzleId),
        sudokuPuzzle:sudokuPuzzleId(puzzleId),
        user:userId(id, displayName, avatarUrl, elder)
      `,
      )
      .in("userId", elderIds)
      .order("startedAt", { ascending: false });

    // Filter by gameType if provided
    if (gameType === "memory") {
      query = query.not("memoryPuzzleId", "is", null);
    } else if (gameType === "logic") {
      query = query.not("logicPuzzleId", "is", null);
    } else if (gameType === "attention") {
      query = query.not("sudokuPuzzleId", "is", null);
    } else if (gameType === "reaction") {
      query = query.is("isFocusGame", true);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("startedAt", startDate);
    }
    if (endDate) {
      query = query.lte("startedAt", endDate);
    }

    // Apply range for pagination
    const start = offset;
    const end = offset + limit - 1;
    query = query.range(start, end) as typeof query;

    const { data, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al listar intentos del grupo", error);
    }

    // Agregar gameType a cada attempt basado en qué puzzle tiene
    const attemptsWithGameType = (data || []).map(attempt => {
      let determinedGameType = 'unknown';

      if (attempt.isFocusGame) {
        determinedGameType = 'focus';
      } else if (attempt.memoryPuzzleId) {
        determinedGameType = 'memory';
      } else if (attempt.logicPuzzleId) {
        determinedGameType = 'logic';
      } else if (attempt.sudokuPuzzleId) {
        determinedGameType = 'sudoku';
      }

      return {
        ...attempt,
        gameType: determinedGameType,
      };
    });

    return attemptsWithGameType;
  }

  /**
   * Obtiene estadísticas de intentos de un usuario para un juego específico
   */
  async getUserStats(
    userId: string,
    gameType: Database["public"]["Enums"]["game_type"],
  ) {
    // Construir query dependiendo del tipo de juego
    let query = this.supabase.from("attempts").select("*").eq("userId", userId);

    // Filtrar por tipo de juego
    if (gameType === "memory") {
      query = query.not("memoryPuzzleId", "is", null);
    } else if (gameType === "logic") {
      query = query.not("logicPuzzleId", "is", null);
    } else if (gameType === "attention") {
      query = query.not("sudokuPuzzleId", "is", null);
    } else if (gameType === "reaction") {
      query = query.is("isFocusGame", true);
    }

    const { data: attempts, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al obtener estadísticas", error);
    }

    if (!attempts || attempts.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDurationMs: null,
        averageMoves: null,
        bestScore: null,
        bestTime: null,
        bestMoves: null,
      };
    }

    const finishedAttempts = attempts.filter((a) => a.finishedAt !== null);
    const successfulAttempts = finishedAttempts.filter(
      (a) => a.success === true,
    );
    const failedAttempts = finishedAttempts.filter((a) => a.success === false);

    const avgDuration =
      finishedAttempts.length > 0
        ? finishedAttempts.reduce((sum, a) => sum + (a.durationMs || 0), 0) /
        finishedAttempts.length
        : null;

    const avgMoves =
      finishedAttempts.length > 0
        ? finishedAttempts.reduce((sum, a) => sum + (a.moves || 0), 0) /
        finishedAttempts.length
        : null;

    const bestScore =
      successfulAttempts.length > 0
        ? Math.max(...successfulAttempts.map((a) => a.score || 0))
        : null;

    const bestTime =
      successfulAttempts.length > 0
        ? Math.min(...successfulAttempts.map((a) => a.durationMs || Infinity))
        : null;

    const bestMoves =
      successfulAttempts.length > 0
        ? Math.min(...successfulAttempts.map((a) => a.moves || Infinity))
        : null;

    return {
      totalAttempts: attempts.length,
      successfulAttempts: successfulAttempts.length,
      failedAttempts: failedAttempts.length,
      averageDurationMs: avgDuration,
      averageMoves: avgMoves,
      bestScore,
      bestTime: bestTime === Infinity ? null : bestTime,
      bestMoves: bestMoves === Infinity ? null : bestMoves,
    };
  }

  /**
   * Obtiene los mejores puntajes globales de un juego
   */
  async getLeaderboard(
    gameType: Database["public"]["Enums"]["game_type"],
    limit = 10,
  ) {
    let query = this.supabase
      .from("attempts")
      .select(
        `
        *,
        user:userId(id, displayName, avatarUrl)
      `,
      )
      .eq("success", true)
      .order("score", { ascending: false })
      .limit(limit);

    // Filtrar por tipo de juego
    if (gameType === "memory") {
      query = query.not("memoryPuzzleId", "is", null);
    } else if (gameType === "logic") {
      query = query.not("logicPuzzleId", "is", null);
    } else if (gameType === "attention") {
      query = query.not("sudokuPuzzleId", "is", null);
    } else if (gameType === "reaction") {
      query = query.is("isFocusGame", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al obtener leaderboard", error);
    }

    return data;
  }
}
