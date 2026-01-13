import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { StartAttempt, FinishAttempt } from "./schema";

export class AttemptService {
  constructor(private supabase: SupabaseClient<Database>) {}

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
      .select("id, userId, finishedAt")
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

    // Calcular el score si no viene en el payload
    const calculatedScore =
      score ?? this.calculateScore(durationMs, moves, success);

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
  ): number {
    if (!success) return 0;

    const durationSeconds = durationMs / 1000;

    // Fórmula: Base 1000 puntos - penalización por tiempo y movimientos
    // Cada segundo resta 5 puntos, cada movimiento resta 10 puntos
    const timepenalty = durationSeconds * 5;
    const movesPenalty = moves * 10;

    const baseScore = 1000;
    const finalScore = Math.max(
      0,
      Math.floor(baseScore - timepenalty - movesPenalty),
    );

    console.log("[BACKEND SCORE CALCULATION]");
    console.log(`  Duration: ${durationMs}ms (${durationSeconds.toFixed(2)}s)`);
    console.log(`  Moves (errores): ${moves}`);
    console.log(`  Time penalty: ${durationSeconds.toFixed(2)} * 5 = ${timepenalty.toFixed(2)}`);
    console.log(`  Moves penalty: ${moves} * 10 = ${movesPenalty}`);
    console.log(`  Final score: ${baseScore} - ${timepenalty.toFixed(2)} - ${movesPenalty} = ${finalScore}`);

    return finalScore;
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
  ) {
    let query = this.supabase
      .from("attempts")
      .select(
        `
        *,
        memoryPuzzle:memoryPuzzleId(puzzleId),
        logicPuzzle:logicPuzzleId(puzzleId),
        sudokuPuzzle:sudokuPuzzleId(puzzleId)
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

    // Apply range for pagination
    const start = offset;
    const end = offset + limit - 1;
    query = query.range(start, end) as typeof query;

    const { data, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al listar intentos", error);
    }

    return data;
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
