import { useGetNotificationsUnreadCount, GetNotificationsUnreadCount200 } from "@elepad/api-client";

/**
 * Hook para obtener el conteo de notificaciones no leídas
 */
export const useNotifications = () => {
  
  const unreadCountQuery = useGetNotificationsUnreadCount({
    query: {
      refetchInterval: 30000, // Refetch cada 30 segundos
      refetchOnWindowFocus: true,
    },
  });

  const unreadCount = (() => {
    if (!unreadCountQuery.data) return 0;
    const data = 'data' in unreadCountQuery.data ? unreadCountQuery.data.data : unreadCountQuery.data;
    if (data && typeof data === 'object' && 'count' in data) {
      return (data as GetNotificationsUnreadCount200).count;
    }
    return 0;
  })();

  return {
    unreadCount,
    isLoading: unreadCountQuery.isLoading,
    error: unreadCountQuery.error,
  };
};
