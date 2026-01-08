import { useGetNotificationsUnreadCount } from "@elepad/api-client";

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

  return {
    unreadCount: unreadCountQuery.data?.count || 0,
    isLoading: unreadCountQuery.isLoading,
    error: unreadCountQuery.error,
  };
};
