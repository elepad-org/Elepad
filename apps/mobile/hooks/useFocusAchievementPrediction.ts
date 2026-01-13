import { useCallback } from "react";
import { useAchievementPrediction, type AttemptData, type PredictedAchievement } from "./useAchievementPrediction";

// Re-exportar el tipo para que sea accesible desde otros módulos
export type { PredictedAchievement } from "./useAchievementPrediction";

/**
 * Hook específico para predicción de logros del juego Focus
 * Los logros de Focus son simples: first_completion, time_under y score
 * No requiere historial de intentos previos
 */
export function useFocusAchievementPrediction() {
  // Usar el hook base que maneja todos los tipos de logros
  const {
    predictAchievements: basePredictAchievements,
    validatePrediction,
    isLoading,
  } = useAchievementPrediction("reaction");

  /**
   * Predice logros para Focus
   * Como Focus no tiene logros de streak, usamos directamente la predicción base
   */
  const predictAchievements = useCallback(
    (attemptData: AttemptData): PredictedAchievement[] => {
      console.log("🔮 [FOCUS PREDICTION] Iniciando predicción de logros para Focus...");
      
      const predicted = basePredictAchievements(attemptData);

      console.log(`🔮 [FOCUS PREDICTION] Total predicho: ${predicted.length} logros`);
      return predicted;
    },
    [basePredictAchievements]
  );

  return {
    predictAchievements,
    validatePrediction,
    isLoading,
  };
}
