import { useState, useCallback } from "react";
import {
  useGetAchievementsUserGameType,
  useGetAttempts,
} from "@elepad/api-client";
import { useAchievementPrediction, type AttemptData, type PredictedAchievement } from "./useAchievementPrediction";

// Re-exportar el tipo para que sea accesible desde otros módulos
export type { PredictedAchievement } from "./useAchievementPrediction";

/**
 * Hook específico para predicción de logros del juego NET
 * Maneja la lógica especial para logros de streak que requieren historial
 */
export function useNetAchievementPrediction() {
  const [recentAttempts, setRecentAttempts] = useState<{ success: boolean; gameType: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Usar el hook base para logros comunes
  const {
    predictAchievements: basePredictAchievements,
    validatePrediction,
    isLoading: isLoadingAchievements,
  } = useAchievementPrediction("logic");

  // Cargar logros del usuario
  const userAchievementsQuery = useGetAchievementsUserGameType("logic");

  // Query para obtener historial de intentos (deshabilitado por defecto)
  const attemptsQuery = useGetAttempts(
    {
      limit: 2,
      offset: 0,
      gameType: "logic",
    },
    {
      query: {
        enabled: false, // Solo se ejecuta manualmente
      },
    }
  );

  /**
   * Cargar los últimos 2 intentos de tipo "logic" para evaluar streaks
   * Se llama al inicio del juego
   */
  const loadRecentAttempts = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const result = await attemptsQuery.refetch();
      const attempts = result.data?.data || result.data || [];
      
      if (Array.isArray(attempts)) {
        // Filtrar solo intentos exitosos de tipo "logic"
        const logicAttempts = attempts
          .filter((a: unknown) => {
            const attempt = a as { success?: boolean; logicPuzzleId?: string };
            return attempt.success === true && attempt.logicPuzzleId;
          })
          .map((a: unknown) => {
            const attempt = a as { success: boolean };
            return {
              success: attempt.success,
              gameType: "logic" as const,
            };
          });
        
        console.log(`📊 [NET PREDICTION] Intentos recientes cargados: ${logicAttempts.length}`);
        setRecentAttempts(logicAttempts);
      }
    } catch (error) {
      console.error("❌ [NET PREDICTION] Error cargando historial:", error);
      setRecentAttempts([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [attemptsQuery]);

  /**
   * Verifica si se cumple la condición de streak (3 juegos consecutivos de NET)
   */
  const checkStreakCondition = useCallback(
    (attemptData: AttemptData): boolean => {
      console.log("🔥 [NET PREDICTION] Verificando streak...");
      console.log(`   Intentos previos: ${recentAttempts.length}`);
      console.log(`   Intento actual: ${attemptData.success ? "exitoso" : "fallido"}`);

      // Necesitamos 2 intentos previos exitosos + el actual
      if (!attemptData.success) {
        console.log("   ❌ Intento actual no exitoso");
        return false;
      }

      if (recentAttempts.length < 2) {
        console.log(`   ❌ Solo hay ${recentAttempts.length} intentos previos (se necesitan 2)`);
        return false;
      }

      // Verificar que los 2 anteriores sean exitosos
      const allPreviousSuccessful = recentAttempts.every((a) => a.success);
      
      if (!allPreviousSuccessful) {
        console.log("   ❌ No todos los intentos previos fueron exitosos");
        return false;
      }

      console.log("   ✅ Streak de 3 juegos consecutivos confirmado!");
      return true;
    },
    [recentAttempts]
  );

  /**
   * Predice logros específicos para NET, incluyendo el de streak
   */
  const predictAchievements = useCallback(
    (attemptData: AttemptData): PredictedAchievement[] => {
      console.log("🔮 [NET PREDICTION] Iniciando predicción de logros para NET...");
      
      // Usar predicción base para logros comunes
      let predicted = basePredictAchievements(attemptData);

      // Evaluar manualmente el logro de streak
      const userAchievements = userAchievementsQuery.data?.data || userAchievementsQuery.data || [];
      
      if (Array.isArray(userAchievements)) {
        const streakAchievement = userAchievements.find((ua: unknown) => {
          const userAchievement = ua as { 
            unlocked?: boolean; 
            achievement?: { 
              condition?: { 
                type?: string; 
                game?: string 
              } 
            } 
          };
          const ach = userAchievement.achievement;
          if (!ach) return false;
          
          // Buscar el logro de streak que no esté desbloqueado
          const condition = ach.condition;
          return (
            !userAchievement.unlocked &&
            condition &&
            condition.type === "streak" &&
            condition.game === "net"
          );
        });

        if (streakAchievement) {
          const ua = streakAchievement as { 
            achievement: { 
              id: string; 
              code: string; 
              title: string; 
              description?: string | null; 
              icon?: string | null; 
              points: number 
            } 
          };
          console.log("🔍 [NET PREDICTION] Evaluando logro de streak:", ua.achievement.title);
          
          if (checkStreakCondition(attemptData)) {
            const ach = ua.achievement;
            console.log("🔮 [NET PREDICTION] ✅ Logro de streak predicho!");
            
            predicted.push({
              id: ach.id,
              code: ach.code,
              title: ach.title,
              description: ach.description,
              icon: ach.icon,
              points: ach.points,
            });
          } else {
            console.log("❌ [NET PREDICTION] No cumple condición de streak");
          }
        }
      }

      console.log(`🔮 [NET PREDICTION] Total predicho: ${predicted.length} logros`);
      return predicted;
    },
    [basePredictAchievements, checkStreakCondition, userAchievementsQuery.data]
  );

  return {
    predictAchievements,
    validatePrediction,
    loadRecentAttempts,
    isLoading: isLoadingAchievements || isLoadingHistory,
    isLoadingHistory,
  };
}
