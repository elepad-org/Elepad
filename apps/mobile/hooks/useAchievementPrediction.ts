import { useState, useCallback } from "react";
import {
  useGetAchievementsUserGameType,
  GetAchievementsUserGameType200Item,
} from "@elepad/api-client";

export interface AttemptData {
  gameType: "memory" | "logic" | "attention" | "reaction";
  gameName?: string;
  success: boolean;
  score: number | null;
  moves: number | null;
  durationMs: number | null;
  userId: string;
}

export interface PredictedAchievement {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  points: number;
}

// Tipado para la condición del achievement que viene del backend
interface AchievementCondition {
  type: "first_completion" | "time_under" | "moves_under" | "score" | "combined" | "streak";
  game?: string;
  value?: number;
  time?: number;
  moves?: number;
}

// Helper para extraer la condición de un achievement
const getCondition = (achievement: GetAchievementsUserGameType200Item["achievement"]): AchievementCondition | null => {
  if (!achievement) return null;
  // El campo condition existe en el objeto pero no está tipado en el cliente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const condition = (achievement as any).condition as unknown;
  if (!condition || typeof condition !== "object") return null;
  return condition as AchievementCondition;
};

/**
 * Hook para predicción optimista de logros
 * Replica la lógica del backend para mostrar logros inmediatamente
 */
export function useAchievementPrediction(gameType: "memory" | "logic" | "attention" | "reaction") {
  const [predictedAchievements, setPredictedAchievements] = useState<PredictedAchievement[]>([]);
  
  // Cargar logros del usuario (incluye toda la info de achievements)
  const userAchievementsQuery = useGetAchievementsUserGameType(gameType, {
    query: {
      enabled: true,
    },
  });

  /**
   * Verifica si se cumple la condición de un logro
   */
  const checkCondition = useCallback(
    (
      achievement: GetAchievementsUserGameType200Item,
      attemptData: AttemptData,
      userAchievements: GetAchievementsUserGameType200Item[],
    ): boolean => {
      // El achievement viene en el campo `achievement` del objeto
      const ach = achievement.achievement;
      const condition = getCondition(ach);
      
      if (!condition) return false;

      // Si el logro especifica un juego específico, verificar que coincida
      if (condition.game && attemptData.gameName !== condition.game) {
        return false;
      }

      switch (condition.type) {
        case "first_completion":
          console.log(`  🔍 Verificando first_completion para ${ach.title}`);
          // ⚠️ IMPORTANTE: No podemos predecir correctamente first_completion en el cliente
          // El backend verifica intentos previos en la BD, no logros desbloqueados
          // Ejemplo: Usuario puede tener intentos exitosos previos pero sin logro desbloqueado
          // Por eso, asumimos que SI es primera vez si NO tiene el logro desbloqueado
          // Esto puede causar falsos positivos, pero el backend corregirá
          
          // Para logros con juego específico
          if (condition.game) {
            console.log(`  🎮 Buscando logro first_completion con juego: ${condition.game}`);
            const hasFirstCompletionOfGame = userAchievements.some(
              (ua) => {
                if (!ua.unlocked) return false;
                const ach = ua.achievement;
                if (!ach) return false;
                const achCondition = getCondition(ach);
                return (
                  achCondition &&
                  achCondition.type === "first_completion" &&
                  achCondition.game === condition.game
                );
              }
            );
            console.log(`  ✅ Resultado: ${!hasFirstCompletionOfGame ? "PREDECIR" : "SALTAR"}`);
            // Si no tiene el logro desbloqueado, asumimos que es primera vez
            return !hasFirstCompletionOfGame;
          }

          // Para logros sin juego específico (por tipo)
          console.log(`  📋 Buscando logro first_completion de gameType: ${gameType}`);
          const hasFirstCompletionOfType = userAchievements.some(
            (ua) => {
              if (!ua.unlocked) return false;
              const ach = ua.achievement;
              if (!ach || ach.gameType !== gameType) return false;
              const achCondition = getCondition(ach);
              const isFirstCompletion = achCondition && achCondition.type === "first_completion" && !achCondition.game;
              if (isFirstCompletion) {
                console.log(`  🎯 Encontrado: ${ach.title} (desbloqueado)`);
              }
              return isFirstCompletion;
            }
          );
          console.log(`  ✅ Resultado: ${!hasFirstCompletionOfType ? "PREDECIR" : "SALTAR"}`);
          // Si no tiene el logro desbloqueado, asumimos que es primera vez
          return !hasFirstCompletionOfType;

        case "time_under":
          const timeValue = typeof condition.value === "number" ? condition.value : 0;
          return (
            attemptData.durationMs !== null &&
            attemptData.durationMs < timeValue * 1000
          );

        case "moves_under":
          const movesValue = typeof condition.value === "number" ? condition.value : 0;
          return attemptData.moves !== null && attemptData.moves < movesValue;

        case "score":
          const scoreValue = typeof condition.value === "number" ? condition.value : 0;
          return attemptData.score !== null && attemptData.score >= scoreValue;

        case "combined":
          const timeLimit = typeof condition.time === "number" ? condition.time : 0;
          const movesLimit = typeof condition.moves === "number" ? condition.moves : 0;
          const passesTime =
            attemptData.durationMs !== null &&
            attemptData.durationMs < timeLimit * 1000;
          const passesMoves =
            attemptData.moves !== null && attemptData.moves < movesLimit;
          return passesTime && passesMoves;

        case "streak":
          // Para streak necesitamos datos históricos que no tenemos en el cliente
          // Por ahora retornamos false y dejamos que el backend lo maneje
          // En una implementación más completa, necesitaríamos cargar historial de intentos
          console.log(
            `⚠️ [PREDICTION] Logro de streak "${ach.title}" requiere verificación en backend`
          );
          return false;

        default:
          console.log(
            `⚠️ [PREDICTION] Tipo de condición desconocido: ${condition.type}`
          );
          return false;
      }
    },
    [gameType]
  );

  /**
   * Predice qué logros se van a desbloquear basándose en el intento
   */
  const predictAchievements = useCallback(
    (attemptData: AttemptData): PredictedAchievement[] => {
      console.log("🔮 [PREDICTION] Iniciando predicción de logros...");
      
      if (!attemptData.success) {
        console.log("🔮 [PREDICTION] Intento no exitoso, sin logros");
        return [];
      }

      const userAchievements = userAchievementsQuery.data?.data || userAchievementsQuery.data || [];

      if (!Array.isArray(userAchievements)) {
        console.log("🔮 [PREDICTION] No se pudieron cargar logros del usuario");
        return [];
      }

      console.log(`🔮 [PREDICTION] Verificando ${userAchievements.length} logros...`);

      const predicted: PredictedAchievement[] = [];

      for (const userAchievement of userAchievements) {
        const ach = userAchievement.achievement;
        
        // Saltar si ya está desbloqueado
        if (userAchievement.unlocked) {
          console.log(`⏭️ [PREDICTION] Saltando ${ach.title} (ya desbloqueado)`);
          continue;
        }

        console.log(`🔍 [PREDICTION] Evaluando: ${ach.title}`);
        
        // Verificar condición
        const meetsCondition = checkCondition(userAchievement, attemptData, userAchievements);

        if (meetsCondition) {
          console.log(`🔮 [PREDICTION] ✅ Logro predicho: ${ach.title}`);
          predicted.push({
            id: ach.id,
            code: ach.code,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            points: ach.points,
          });
        } else {
          console.log(`❌ [PREDICTION] NO cumple condición: ${ach.title}`);
        }
      }

      console.log(`🔮 [PREDICTION] Total predicho: ${predicted.length} logros`);
      setPredictedAchievements(predicted);
      return predicted;
    },
    [userAchievementsQuery.data, checkCondition]
  );

  /**
   * Compara logros predichos con los reales del backend
   * Retorna true si coinciden, false si hay diferencia
   */
  const validatePrediction = useCallback(
    (predicted: PredictedAchievement[], realAchievements: PredictedAchievement[]): boolean => {
      console.log("🔍 [VALIDATION] Comparando predicción con backend...");
      console.log(`🔍 [VALIDATION] Predichos: ${predicted.length}`);
      console.log(`🔍 [VALIDATION] Reales: ${realAchievements.length}`);

      if (predicted.length !== realAchievements.length) {
        console.log("❌ [VALIDATION] Cantidad diferente");
        return false;
      }

      const predictedIds = new Set(predicted.map((a) => a.id));
      const realIds = new Set(realAchievements.map((a) => a.id));

      for (const id of predictedIds) {
        if (!realIds.has(id)) {
          console.log(`❌ [VALIDATION] Logro ${id} predicho pero no real`);
          return false;
        }
      }

      for (const id of realIds) {
        if (!predictedIds.has(id)) {
          console.log(`❌ [VALIDATION] Logro ${id} real pero no predicho`);
          return false;
        }
      }

      console.log("✅ [VALIDATION] Predicción correcta");
      return true;
    },
    []
  );

  return {
    predictAchievements,
    predictedAchievements,
    validatePrediction,
    isLoading: userAchievementsQuery.isLoading,
    isError: userAchievementsQuery.isError,
  };
}
