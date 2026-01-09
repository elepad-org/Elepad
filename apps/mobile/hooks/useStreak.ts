import { useQuery } from "@tanstack/react-query";
import { useGetStreaksMe, useGetStreaksHistory } from "@elepad/api-client";
import { useEffect, useRef } from "react";
import { useStreakSnackbar } from "./useStreakSnackbar";
import { isSameLocalDate, utcDateToLocal } from "@/lib/dateHelpers";

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
    if (query.data?.currentStreak !== undefined) {
      const currentStreak = query.data.currentStreak;
      
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
  }, [query.data?.currentStreak, showStreakExtended]);

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
  const localData = query.data ? {
    ...query.data,
    dates: ('data' in query.data ? query.data.data?.dates : query.data.dates)?.map(utcDateToLocal) || []
  } : undefined;

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
