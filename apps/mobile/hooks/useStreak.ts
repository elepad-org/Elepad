import { useGetStreaksMe, useGetStreaksHistory, GetStreaksHistory200 } from "@elepad/api-client";


/**
 * Hook para obtener la racha actual del usuario
 */
export function useUserStreak() {


  
  // Obtener la fecha local del cliente en formato YYYY-MM-DD
  const getClientDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const query = useGetStreaksMe({
    clientDate: getClientDate(),
  }, {
    query: {
      staleTime: 0, // Siempre considerar datos obsoletos para refetch inmediato
      gcTime: 1000 * 60, // Mantener en caché 1 minuto para navegación rápida (gcTime reemplaza cacheTime en v5)
      refetchOnMount: "always", // Siempre refetch al montar componente
      refetchOnWindowFocus: true,
    },
  });



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
