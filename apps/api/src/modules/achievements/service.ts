import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";

export class AchievementService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Lista todos los logros disponibles para un tipo de juego
   */
  async listAchievementsByGameType(
    gameType: Database["public"]["Enums"]["game_type"],
  ) {
    const { data, error } = await this.supabase
      .from("achievements")
      .select("*")
      .eq("gameType", gameType)
      .order("points", { ascending: true });

    if (error) {
      throw new ApiException(500, "Error al listar logros", error);
    }

    return data;
  }

  /**
   * Lista todos los logros con información de si el usuario los desbloqueó
   */
  async listAchievementsWithUnlockStatus(
    userId: string,
    gameType?: Database["public"]["Enums"]["game_type"],
  ) {
    // Obtener todos los logros
    let achievementsQuery = this.supabase
      .from("achievements")
      .select("*")
      .order("points", { ascending: true });

    if (gameType) {
      achievementsQuery = achievementsQuery.eq("gameType", gameType);
    }

    const { data: achievements, error: achievementsError } =
      await achievementsQuery;

    if (achievementsError) {
      throw new ApiException(500, "Error al listar logros", achievementsError);
    }

    // Obtener los logros desbloqueados por el usuario
    const { data: userAchievements, error: userAchievementsError } =
      await this.supabase
        .from("user_achievements")
        .select("achievementId, unlockedAt")
        .eq("userId", userId);

    if (userAchievementsError) {
      throw new ApiException(
        500,
        "Error al obtener logros del usuario",
        userAchievementsError,
      );
    }

    // Crear un mapa de logros desbloqueados
    const unlockedMap = new Map(
      userAchievements?.map((ua) => [ua.achievementId, ua.unlockedAt]) || [],
    );

    // Combinar información
    return achievements.map((achievement) => ({
      achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null,
    }));
  }

  /**
   * Desbloquea un logro para un usuario
   */
  async unlockAchievement(userId: string, achievementCode: string) {
    // Buscar el logro por código
    const { data: achievement, error: achievementError } = await this.supabase
      .from("achievements")
      .select("*")
      .eq("code", achievementCode)
      .single();

    if (achievementError || !achievement) {
      throw new ApiException(404, "Logro no encontrado");
    }

    // Verificar si ya está desbloqueado
    const { data: existing } = await this.supabase
      .from("user_achievements")
      .select("id")
      .eq("userId", userId)
      .eq("achievementId", achievement.id)
      .maybeSingle();

    if (existing) {
      // Ya está desbloqueado, retornar sin error
      return { achievement, alreadyUnlocked: true };
    }

    // Desbloquear el logro
    const { data: userAchievement, error: unlockError } = await this.supabase
      .from("user_achievements")
      .insert({
        userId,
        achievementId: achievement.id,
      })
      .select()
      .single();

    if (unlockError) {
      throw new ApiException(500, "Error al desbloquear logro", unlockError);
    }

    return { achievement, userAchievement, alreadyUnlocked: false };
  }

  /**
   * Verifica y desbloquea logros automáticamente basándose en un intento completado
   */
  async checkAndUnlockAchievements(
    userId: string,
    attemptId: string,
  ): Promise<Database["public"]["Tables"]["achievements"]["Row"][]> {
    console.log(
      `📊 Iniciando verificación de logros para attemptId: ${attemptId}`,
    );

    // Obtener detalles del intento
    const { data: attempt, error: attemptError } = await this.supabase
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      console.error(`❌ Intento no encontrado:`, attemptError);
      throw new ApiException(404, "Intento no encontrado");
    }

    if (!attempt.success) {
      console.log(`⚠️ Intento no exitoso, no se verifican logros`);
      return [];
    }

    // Determinar el tipo de juego
    let gameType: Database["public"]["Enums"]["game_type"] | null = null;
    if (attempt.memoryPuzzleId) gameType = "memory";
    else if (attempt.logicPuzzleId) gameType = "logic";
    else if (attempt.sudokuPuzzleId) gameType = "attention";
    else if (attempt.isFocusGame) gameType = "reaction";

    if (!gameType) {
      console.log(`⚠️ No se pudo determinar el tipo de juego`);
      return [];
    }

    // Obtener gameName del puzzle UNA SOLA VEZ
    const gameName = await this.getPuzzleGameName(attempt);

    // Obtener logros del tipo y logros ya desbloqueados EN PARALELO
    const [achievementsResult, userAchievementsResult] = await Promise.all([
      this.supabase
        .from("achievements")
        .select("*")
        .eq("gameType", gameType)
        .order("points", { ascending: true }),
      this.supabase
        .from("user_achievements")
        .select("achievementId")
        .eq("userId", userId),
    ]);

    if (achievementsResult.error) {
      throw new ApiException(
        500,
        "Error al obtener logros",
        achievementsResult.error,
      );
    }

    const achievements = achievementsResult.data || [];
    const unlockedIds = new Set(
      userAchievementsResult.data?.map((ua) => ua.achievementId) || [],
    );

    console.log(`🏆 Verificando ${achievements.length} logros...`);

    // Verificar condiciones y desbloquear
    const unlockedAchievements = [];

    for (const achievement of achievements) {
      // Saltar si ya está desbloqueado
      if (unlockedIds.has(achievement.id)) continue;

      // Verificar condición
      const meetsCondition = await this.checkAchievementCondition(
        userId,
        achievement,
        attempt,
        gameType,
        gameName,
      );

      if (meetsCondition) {
        console.log(`  🎉 Desbloqueando: ${achievement.title}`);
        const result = await this.unlockAchievement(userId, achievement.code);
        if (!result.alreadyUnlocked) {
          unlockedAchievements.push(result.achievement);
        }
      }
    }

    console.log(
      `🎊 Total de logros desbloqueados: ${unlockedAchievements.length}`,
    );
    return unlockedAchievements;
  }

  /**
   * Obtiene el gameName del puzzle de un intento
   */
  private async getPuzzleGameName(attempt: {
    memoryPuzzleId: string | null;
    logicPuzzleId: string | null;
    sudokuPuzzleId: string | null;
  }): Promise<string | null> {
    const puzzleId = attempt.memoryPuzzleId || attempt.logicPuzzleId;

    if (!puzzleId) return null;

    const { data: puzzle } = await this.supabase
      .from("puzzles")
      .select("gameName")
      .eq("id", puzzleId)
      .single();

    return puzzle?.gameName || null;
  }

  /**
   * Verifica si se cumple la condición de un logro
   */
  private async checkAchievementCondition(
    userId: string,
    achievement: Database["public"]["Tables"]["achievements"]["Row"],
    attempt: Database["public"]["Tables"]["attempts"]["Row"],
    gameType: Database["public"]["Enums"]["game_type"],
    gameName: string | null,
  ): Promise<boolean> {
    const condition = achievement.condition as Record<
      string,
      string | number | boolean
    >;

    // Si el logro especifica un juego específico, verificar que coincida
    if (condition.game && gameName !== condition.game) {
      return false;
    }

    switch (condition.type) {
      case "first_completion":
        // Si el logro es para un juego específico (ej: "net")
        if (condition.game) {
          // Contar intentos previos exitosos del mismo juego específico
          const { data: prevAttempts } = await this.supabase
            .from("attempts")
            .select("id, memoryPuzzleId, logicPuzzleId, sudokuPuzzleId")
            .eq("userId", userId)
            .eq("success", true)
            .neq("id", attempt.id);

          if (!prevAttempts || prevAttempts.length === 0) {
            return true;
          }

          // Verificar cuántos intentos son del mismo juego
          let countSameGame = 0;
          for (const prevAttempt of prevAttempts) {
            const prevGameName = await this.getPuzzleGameName(prevAttempt);
            if (prevGameName === condition.game) {
              countSameGame++;
            }
          }

          return countSameGame === 0;
        }

        // Si no especifica juego, verificar por tipo (memory, logic, calculation)
        let previousQuery = this.supabase
          .from("attempts")
          .select("id")
          .eq("userId", userId)
          .eq("success", true)
          .neq("id", attempt.id);

        if (gameType === "memory" && attempt.memoryPuzzleId) {
          previousQuery = previousQuery.not("memoryPuzzleId", "is", null);
        } else if (gameType === "logic" && attempt.logicPuzzleId) {
          previousQuery = previousQuery.not("logicPuzzleId", "is", null);
        }

        const { data: previousAttempts } = await previousQuery;
        return previousAttempts?.length === 0;

      case "time_under":
        const timeValue =
          typeof condition.value === "number" ? condition.value : 0;
        const passesTime =
          attempt.durationMs !== null && attempt.durationMs < timeValue * 1000;
        return passesTime;

      case "moves_under":
        const movesValue =
          typeof condition.value === "number" ? condition.value : 0;
        return attempt.moves !== null && attempt.moves < movesValue;

      case "combined":
        const timeLimit =
          typeof condition.time === "number" ? condition.time : 0;
        const movesLimit =
          typeof condition.moves === "number" ? condition.moves : 0;
        const passesTimeCheck =
          attempt.durationMs !== null && attempt.durationMs < timeLimit * 1000;
        const passesMovesCheck =
          attempt.moves !== null && attempt.moves < movesLimit;
        return passesTimeCheck && passesMovesCheck;

      case "streak":
        const streakValue =
          typeof condition.value === "number" ? condition.value : 0;

        // Obtener los últimos N intentos (donde N = streakValue)
        let streakQuery = this.supabase
          .from("attempts")
          .select(
            "id, success, memoryPuzzleId, logicPuzzleId, sudokuPuzzleId, finishedAt",
          )
          .eq("userId", userId)
          .not("finishedAt", "is", null)
          .order("finishedAt", { ascending: false })
          .limit(streakValue);

        // Filtrar por tipo de juego si no hay juego específico
        if (!condition.game) {
          if (gameType === "memory" && attempt.memoryPuzzleId) {
            streakQuery = streakQuery.not("memoryPuzzleId", "is", null);
          } else if (gameType === "logic" && attempt.logicPuzzleId) {
            streakQuery = streakQuery.not("logicPuzzleId", "is", null);
          }
        }

        const { data: recentAttempts } = await streakQuery;

        if (!recentAttempts || recentAttempts.length < streakValue) {
          console.log(
            `    🔥 Racha insuficiente: ${recentAttempts?.length || 0}/${streakValue}`,
          );
          return false;
        }

        // Verificar que todos sean exitosos y del mismo juego (si aplica)
        let consecutiveWins = 0;
        for (const recentAttempt of recentAttempts) {
          if (!recentAttempt.success) break;

          if (condition.game) {
            const attemptGameName = await this.getPuzzleGameName(recentAttempt);
            if (attemptGameName !== condition.game) break;
          }

          consecutiveWins++;
        }

        const hasStreak = consecutiveWins >= streakValue;
        console.log(
          `    🔥 Racha: ${consecutiveWins}/${streakValue} = ${hasStreak}`,
        );
        return hasStreak;

      default:
        console.log(`    ⚠️ Tipo de condición desconocido: ${condition.type}`);
        return false;
    }
  }

  /**
   * Obtiene el progreso de logros del usuario
   */
  async getUserAchievementProgress(
    userId: string,
    gameType?: Database["public"]["Enums"]["game_type"],
  ) {
    // Obtener todos los logros
    let achievementsQuery = this.supabase.from("achievements").select("points");

    if (gameType) {
      achievementsQuery = achievementsQuery.eq("gameType", gameType);
    }

    const { data: allAchievements, error: achievementsError } =
      await achievementsQuery;

    if (achievementsError) {
      throw new ApiException(500, "Error al obtener logros", achievementsError);
    }

    // Obtener logros desbloqueados
    let userAchievementsQuery = this.supabase
      .from("user_achievements")
      .select("achievementId, achievements!inner(points, gameType)")
      .eq("userId", userId);

    if (gameType) {
      userAchievementsQuery = userAchievementsQuery.eq(
        "achievements.gameType",
        gameType,
      );
    }

    const { data: userAchievements, error: userError } =
      await userAchievementsQuery;

    if (userError) {
      throw new ApiException(
        500,
        "Error al obtener logros del usuario",
        userError,
      );
    }

    const totalPoints = allAchievements.reduce(
      (sum, a) => sum + (a.points || 0),
      0,
    );
    const earnedPoints = userAchievements.reduce((sum, ua) => {
      const achievement = ua.achievements as { points?: number } | null;
      return sum + (achievement?.points || 0);
    }, 0);

    return {
      totalAchievements: allAchievements.length,
      unlockedAchievements: userAchievements.length,
      totalPoints,
      earnedPoints,
    };
  }
}
