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

    console.log(`✅ Intento encontrado:`, {
      success: attempt.success,
      moves: attempt.moves,
      durationMs: attempt.durationMs,
      score: attempt.score,
    });

    if (!attempt.success) {
      console.log(`⚠️ Intento no exitoso, no se verifican logros`);
      return [];
    }

    // Determinar el tipo de juego
    let gameType: Database["public"]["Enums"]["game_type"] | null = null;
    if (attempt.memoryPuzzleId) gameType = "memory";
    else if (attempt.logicPuzzleId) gameType = "logic";
    else if (attempt.sudokuPuzzleId) gameType = "calculation";

    console.log(`🎮 Tipo de juego detectado: ${gameType}`);

    if (!gameType) {
      console.log(`⚠️ No se pudo determinar el tipo de juego`);
      return [];
    }

    // Obtener todos los logros del tipo de juego
    const achievements = await this.listAchievementsByGameType(gameType);
    console.log(`🏆 Logros disponibles para ${gameType}:`, achievements.length);

    // Verificar condiciones y desbloquear
    const unlockedAchievements = [];

    for (const achievement of achievements) {
      console.log(
        `🔍 Verificando logro: ${achievement.title} (${achievement.code})`,
      );

      // Verificar si ya está desbloqueado
      const { data: existing } = await this.supabase
        .from("user_achievements")
        .select("id")
        .eq("userId", userId)
        .eq("achievementId", achievement.id)
        .maybeSingle();

      if (existing) {
        console.log(`  ⏭️ Ya desbloqueado, saltando...`);
        continue;
      }

      // Verificar condición
      const meetsCondition = await this.checkAchievementCondition(
        userId,
        achievement,
        attempt,
        gameType,
      );

      console.log(`  ✓ Condición cumplida: ${meetsCondition}`);

      if (meetsCondition) {
        console.log(`  🎉 Desbloqueando logro...`);
        const result = await this.unlockAchievement(userId, achievement.code);
        if (!result.alreadyUnlocked) {
          unlockedAchievements.push(result.achievement);
          console.log(`  ✅ Logro desbloqueado exitosamente`);
        }
      }
    }

    console.log(
      `🎊 Total de logros desbloqueados: ${unlockedAchievements.length}`,
    );
    return unlockedAchievements;
  }

  /**
   * Verifica si se cumple la condición de un logro
   */
  private async checkAchievementCondition(
    userId: string,
    achievement: Database["public"]["Tables"]["achievements"]["Row"],
    attempt: Database["public"]["Tables"]["attempts"]["Row"],
    gameType: Database["public"]["Enums"]["game_type"],
  ): Promise<boolean> {
    const condition = achievement.condition as Record<
      string,
      string | number | boolean
    >;
    console.log(`    🔎 Evaluando condición:`, condition);

    switch (condition.type) {
      case "first_completion":
        // Verificar si es el primer intento exitoso
        const { data: previousAttempts } = await this.supabase
          .from("attempts")
          .select("id")
          .eq("userId", userId)
          .eq("success", true)
          .neq("id", attempt.id);

        console.log(
          `    📋 Intentos previos exitosos:`,
          previousAttempts?.length || 0,
        );

        if (gameType === "memory") {
          const isFirst =
            previousAttempts?.filter((a) => a.id !== attempt.id).length === 0;
          console.log(`    ✓ Es el primer intento de memoria: ${isFirst}`);
          return isFirst;
        }
        const isFirst = previousAttempts?.length === 0;
        console.log(`    ✓ Es el primer intento: ${isFirst}`);
        return isFirst;

      case "time_under":
        const timeValue =
          typeof condition.value === "number" ? condition.value : 0;
        const timeInSeconds = (attempt.durationMs || 0) / 1000;
        const passesTime =
          attempt.durationMs !== null && attempt.durationMs < timeValue * 1000;
        console.log(
          `    ⏱️ Tiempo: ${timeInSeconds.toFixed(2)}s / ${timeValue}s = ${passesTime}`,
        );
        return passesTime;

      case "moves_under":
        const movesValue =
          typeof condition.value === "number" ? condition.value : 0;
        const passesMoves =
          attempt.moves !== null && attempt.moves < movesValue;
        console.log(
          `    🎯 Movimientos: ${attempt.moves} / ${movesValue} = ${passesMoves}`,
        );
        return passesMoves;

      case "combined":
        const timeLimit =
          typeof condition.time === "number" ? condition.time : 0;
        const movesLimit =
          typeof condition.moves === "number" ? condition.moves : 0;
        const timeInSec = (attempt.durationMs || 0) / 1000;
        const passesTimeCheck =
          attempt.durationMs !== null && attempt.durationMs < timeLimit * 1000;
        const passesMovesCheck =
          attempt.moves !== null && attempt.moves < movesLimit;
        const passesCombined = passesTimeCheck && passesMovesCheck;
        console.log(
          `    ⏱️+🎯 Tiempo: ${timeInSec.toFixed(2)}s/${timeLimit}s, Movimientos: ${attempt.moves}/${movesLimit} = ${passesCombined}`,
        );
        return passesCombined;

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
