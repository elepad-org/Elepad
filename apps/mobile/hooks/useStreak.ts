import { useGetStreaksMe, useGetStreaksHistory, GetStreaksMe200, GetStreaksHistory200 } from "@elepad/api-client";
import { useEffect, useRef } from "react";
import { useStreakSnackbar } from "./useStreakSnackbar";

/**
 * Hook para obtener la racha actual del usuario
 */
export function useUserStreak() {
  const { showStreakExtended } = useStreakSnackbar();
  const previousStreakRef = useRef<number | null>(null);
  
  const query = useGetStreaksMe({
    query: {
      staleTime: 0, // Siempre considerar datos obsoletos para refetch inmediato
      gcTime: 1000 * 60, // Mantener en caché 1 minuto para navegación rápida (gcTime reemplaza cacheTime en v5)
      refetchOnMount: "always", // Siempre refetch al montar componente
      refetchOnWindowFocus: true,
    },
  });

  // Detectar cuando se extiende la racha
  useEffect(() => {
    if (query.data) {
      const responseData = 'data' in query.data ? query.data.data : query.data;
      if (responseData && typeof responseData === 'object' && 'currentStreak' in responseData) {
        const streakData = responseData as GetStreaksMe200;
        const currentStreak = streakData.currentStreak;
        
        // Si había una racha previa y aumentó, mostrar toast
        // Incluye el caso de 0 -> 1 (primera racha)
        if (
          previousStreakRef.current !== null && 
          currentStreak > previousStreakRef.current &&
          currentStreak > 0
        ) {
          console.log(`🔥 Racha extendida: ${previousStreakRef.current} -> ${currentStreak}`);
          showStreakExtended(currentStreak);
        }
        
        previousStreakRef.current = currentStreak;
      }
    }
  }, [query.data, showStreakExtended]);

  return query;
}

/**
 * Hook para obtener el historial de días jugados
 * @param startDate - Fecha de inicio (YYYY-MM-DD)
 * @param endDate - Fecha de fin (YYYY-MM-DD)
 */
export function useStreakHistory(startDate?: string, endDate?: string) {
  const query = useGetStreaksHistory(
    { startDate, endDate },
    {
      query: {
        enabled: !!startDate || !!endDate,
        staleTime: 0, // Siempre considerar datos obsoletos para refetch inmediato
        gcTime: 1000 * 60, // Mantener en caché 1 minuto para navegación rápida (gcTime reemplaza cacheTime en v5)
        refetchOnMount: "always", // Siempre refetch al montar componente
        refetchOnWindowFocus: true,
      },
    },
  );

  // Convertir fechas UTC del backend a fechas locales
  const localData = query.data ? (() => {
    const responseData = 'data' in query.data ? query.data.data : query.data;
    if (responseData && typeof responseData === 'object' && 'dates' in responseData) {
      const historyData = responseData as GetStreaksHistory200;
      // Las fechas ya vienen en formato local (YYYY-MM-DD) del backend
      // NO necesitan conversión porque el cliente envía clientDate en hora local
      return historyData;
    }
    return undefined;
  })() : undefined;

  return {
    ...query,
    data: localData,
  };
}

/**
 * Hook combinado que obtiene tanto la racha como el historial
 * para un rango de fechas específico
 */
export function useStreakData(startDate?: string, endDate?: string) {
  const streakQuery = useUserStreak();
  const historyQuery = useStreakHistory(startDate, endDate);

  return {
    streak: streakQuery.data,
    history: historyQuery.data?.dates || [],
    isLoading: streakQuery.isLoading || historyQuery.isLoading,
    isError: streakQuery.isError || historyQuery.isError,
    refetch: async () => {
      await Promise.all([streakQuery.refetch(), historyQuery.refetch()]);
    },
  };
}
