import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";

export class StreakService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtiene la racha actual del usuario
   */
  async getUserStreak(userId: string) {
    const { data: streak, error } = await this.supabase
      .from("user_streaks")
      .select("currentStreak, longestStreak, lastPlayedDate")
      .eq("userId", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new ApiException(500, "Error al obtener la racha", error);
    }

    // Si no existe racha, retornar valores por defecto
    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: null,
      };
    }

    // Validar si la racha debe resetearse
    const validated = await this.validateStreak(userId, streak);

    return validated;
  }

  /**
   * Obtiene el historial de días jugados para visualizar en el calendario
   */
  async getStreakHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    let query = this.supabase
      .from("streak_history")
      .select("playedDate")
      .eq("userId", userId)
      .order("playedDate", { ascending: false });

    if (startDate) {
      query = query.gte("playedDate", startDate);
    }

    if (endDate) {
      query = query.lte("playedDate", endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiException(500, "Error al obtener historial", error);
    }

    return {
      dates: data?.map((h) => h.playedDate) || [],
    };
  }

  /**
   * Actualiza la racha cuando el usuario completa un juego
   * @param userId - ID del usuario
   * @param clientDate - Fecha local del cliente en formato YYYY-MM-DD (opcional, se calcula en UTC si no se provee)
   */
  async updateStreakOnGameCompletion(userId: string, clientDate?: string) {
    const today = clientDate || this.getTodayDate();

    console.log("📅 [STREAK] updateStreakOnGameCompletion");
    console.log("📅 [STREAK] userId:", userId);
    console.log("📅 [STREAK] clientDate recibido:", clientDate);
    console.log("📅 [STREAK] today usado:", today);

    // Verificar si ya jugó hoy
    const { data: alreadyPlayed, error: historyError } = await this.supabase
      .from("streak_history")
      .select("id, playedDate")
      .eq("userId", userId)
      .eq("playedDate", today)
      .single();

    console.log("📅 [STREAK] Query streak_history:");
    console.log("📅 [STREAK]   - userId:", userId);
    console.log("📅 [STREAK]   - playedDate buscado:", today);
    console.log("📅 [STREAK]   - alreadyPlayed:", alreadyPlayed);
    console.log("📅 [STREAK]   - error:", historyError?.message || "none");

    // Si ya jugó hoy, no hacer nada
    if (alreadyPlayed) {
      console.log(`ℹ️ [STREAK] Usuario ${userId} ya jugó hoy (${today})`);
      return;
    }

    console.log("✅ [STREAK] No hay registro previo para hoy, continuando...");

    console.log("✅ [STREAK] No hay registro previo para hoy, continuando...");

    // Insertar en historial
    console.log("📅 [STREAK] Insertando en streak_history:", { userId, playedDate: today });
    await this.supabase.from("streak_history").insert({
      userId,
      playedDate: today,
    });

    // Obtener racha actual
    const { data: currentStreak } = await this.supabase
      .from("user_streaks")
      .select("*")
      .eq("userId", userId)
      .single();

    console.log("📅 [STREAK] currentStreak en DB:", currentStreak);

    let newCurrentStreak = 1;
    let newLongestStreak = 1;

    if (currentStreak) {
      const lastPlayed = currentStreak.lastPlayedDate;

      console.log("📅 [STREAK] Comparando fechas:");
      console.log("📅 [STREAK]   - lastPlayedDate (DB):", lastPlayed);
      console.log("📅 [STREAK]   - today (cliente):", today);

      if (lastPlayed) {
        const daysDiff = this.getDaysDifference(lastPlayed, today);

        console.log("📅 [STREAK]   - daysDiff:", daysDiff);

        if (daysDiff === 1) {
          // Continúa la racha
          newCurrentStreak = currentStreak.currentStreak + 1;
          newLongestStreak = Math.max(
            newCurrentStreak,
            currentStreak.longestStreak,
          );
          console.log("🔥 [STREAK] Racha continúa:", newCurrentStreak);
        } else if (daysDiff === 0) {
          // Ya jugó hoy (no debería pasar por el check anterior)
          console.log("⚠️ [STREAK] daysDiff === 0 pero no encontró en history!");
          return;
        } else {
          // Racha rota
          newCurrentStreak = 1;
          newLongestStreak = currentStreak.longestStreak;
          console.log("💔 [STREAK] Racha rota, reiniciando a 1");
        }
      }

      // Actualizar racha existente
      console.log("📅 [STREAK] Actualizando user_streaks:", {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastPlayedDate: today,
      });
      await this.supabase
        .from("user_streaks")
        .update({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastPlayedDate: today,
        })
        .eq("userId", userId);
    } else {
      // Crear nueva racha
      console.log("📅 [STREAK] Creando nueva racha");
      await this.supabase.from("user_streaks").insert({
        userId,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastPlayedDate: today,
      });
    }

    console.log("✅ [STREAK] Racha actualizada exitosamente");
  }

  /**
   * Valida si la racha debe resetearse (si pasó más de un día sin jugar)
   */
  private async validateStreak(
    userId: string,
    streak: {
      currentStreak: number;
      longestStreak: number;
      lastPlayedDate: string | null;
    },
  ) {
    if (!streak.lastPlayedDate) {
      return streak;
    }

    const today = this.getTodayDate();
    const daysDiff = this.getDaysDifference(streak.lastPlayedDate, today);

    // Si pasó más de 1 día, resetear la racha
    if (daysDiff > 1) {
      await this.supabase
        .from("user_streaks")
        .update({
          currentStreak: 0,
        })
        .eq("userId", userId);

      return {
        currentStreak: 0,
        longestStreak: streak.longestStreak,
        lastPlayedDate: streak.lastPlayedDate,
      };
    }

    return streak;
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   */
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  /**
   * Calcula la diferencia en días entre dos fechas
   */
  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
