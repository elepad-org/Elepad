import { useQuery } from "@tanstack/react-query";
import { useGetStreaksMe, useGetStreaksHistory } from "@elepad/api-client";

/**
 * Hook para obtener la racha actual del usuario
 */
export function useUserStreak() {
  return useGetStreaksMe({
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });
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
