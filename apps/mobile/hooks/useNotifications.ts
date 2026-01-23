import { useGetNotificationsUnreadCount, GetNotificationsUnreadCount200 } from "@elepad/api-client";
import { useEffect, useRef } from "react";
import { setBadgeCount, showLocalNotification } from "@/lib/pushNotifications";

/**
 * Hook para obtener el conteo de notificaciones no leídas
 */
export const useNotifications = () => {
  const previousCount = useRef<number>(0);
  
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

  // Actualizar badge y mostrar notificación cuando hay nuevas notificaciones
  useEffect(() => {
    // Actualizar el badge count
    setBadgeCount(unreadCount);

    // Si el conteo aumentó, significa que hay una nueva notificación
    if (unreadCount > previousCount.current && previousCount.current > 0) {
      const newNotificationsCount = unreadCount - previousCount.current;
      showLocalNotification(
        'Nueva notificación',
        `Tienes ${newNotificationsCount} ${newNotificationsCount === 1 ? 'nueva notificación' : 'nuevas notificaciones'}`,
        { type: 'new_notification' }
      );
    }

    previousCount.current = unreadCount;
  }, [unreadCount]);

  return {
    unreadCount,
    isLoading: unreadCountQuery.isLoading,
    error: unreadCountQuery.error,
  };
};
