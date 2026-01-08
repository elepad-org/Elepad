import { useQuery } from "@tanstack/react-query";
import { useGetStreaksMe, useGetStreaksHistory } from "@elepad/api-client";
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
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  // Detectar cuando se extiende la racha
  useEffect(() => {
    if (query.data?.currentStreak) {
      const currentStreak = query.data.currentStreak;
      
      // Si había una racha previa y aumentó, mostrar toast
      if (previousStreakRef.current !== null && currentStreak > previousStreakRef.current) {
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
  return useGetStreaksHistory(
    { startDate, endDate },
    {
      query: {
        enabled: !!startDate || !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnMount: true,
        refetchOnWindowFocus: true,
      },
    },
  );
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
