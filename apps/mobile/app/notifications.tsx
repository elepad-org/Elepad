import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Pressable,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  IconButton,
  Button,
  Chip,
  Dialog,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  useGetNotifications,
  usePatchNotificationsIdRead,
  usePatchNotificationsReadAll,
  useDeleteNotificationsId,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200,
  useGetMemoriesId,
  Memory,
  useGetActivitiesId,
  Activity,
} from "@elepad/api-client";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HighlightedMentionText from "@/components/Recuerdos/HighlightedMentionText";
import RecuerdoDetailDialog from "@/components/Recuerdos/RecuerdoDetailDialog";
import { Portal } from "react-native-paper";

const PAGE_SIZE = 20;

// Tipos de recuerdos
type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  descripcion?: string;
  autorId?: string;
  autorNombre?: string;
  fecha: Date;
}

// Función auxiliar para convertir Memory a Recuerdo
const memoryToRecuerdo = (
  memory: Memory,
  memberNameById: Record<string, string>,
): Recuerdo => {
  let tipo: RecuerdoTipo = "texto";

  if (memory.mimeType) {
    if (memory.mimeType.startsWith("image/")) {
      tipo = "imagen";
    } else if (memory.mimeType.startsWith("audio/")) {
      tipo = "audio";
    } else if (memory.mimeType.startsWith("video/")) {
      tipo = "video";
    } else if (memory.mimeType === "text/note") {
      tipo = "texto";
    }
  }

  return {
    id: memory.id,
    tipo,
    contenido: memory.mediaUrl || memory.caption || "",
    miniatura:
      (memory.mimeType?.startsWith("image/") ||
        memory.mimeType?.startsWith("video/")) &&
      memory.mediaUrl
        ? memory.mediaUrl
        : undefined,
    titulo: memory.title || undefined,
    descripcion: memory.caption || undefined,
    autorId: memory.createdBy,
    autorNombre: memberNameById[memory.createdBy] || undefined,
    fecha: new Date(memory.createdAt),
  };
};

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userElepad } = useAuth();
  const [page, setPage] = useState(0);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityDetailDialogVisible, setActivityDetailDialogVisible] = useState(false);

  // Fetch family members for displaying names in mentions
  const membersQuery = useGetFamilyGroupIdGroupMembers(
    userElepad?.groupId || "",
    {
      query: {
        enabled: !!userElepad?.groupId,
      },
    },
  );

  const selectGroupInfo = (): GetFamilyGroupIdGroupMembers200 | undefined => {
    const resp = membersQuery.data as
      | { data?: GetFamilyGroupIdGroupMembers200 }
      | GetFamilyGroupIdGroupMembers200
      | undefined;
    if (!resp) return undefined;
    return (
      (resp as { data?: GetFamilyGroupIdGroupMembers200 }).data ??
      (resp as GetFamilyGroupIdGroupMembers200)
    );
  };

  const groupInfo = selectGroupInfo();
  
  // Query para obtener el recuerdo seleccionado
  const memoryQuery = useGetMemoriesId(
    selectedMemoryId || "",
    {
      query: {
        enabled: !!selectedMemoryId,
      },
    },
  );

  // Query para obtener la actividad seleccionada
  const activityQuery = useGetActivitiesId(
    selectedActivityId || "",
    {
      query: {
        enabled: !!selectedActivityId,
      },
    },
  );

  const groupMembers = useMemo(() => {
    if (!groupInfo) {
      return [] as Array<{ id: string; displayName: string; avatarUrl?: string | null }>;
    }

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<string, { id: string; displayName: string; avatarUrl?: string | null }>();
    
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, { id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl ?? null });
    }
    
    return Array.from(byId.values());
  }, [groupInfo]);

  // Fetch notifications
  const notificationsQuery = useGetNotifications(
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    {
      query: {
        refetchOnWindowFocus: false,
      },
    },
  );

  // Mark as read mutation
  const markAsReadMutation = usePatchNotificationsIdRead();

  // Mark all as read mutation
  const markAllAsReadMutation = usePatchNotificationsReadAll();

  // Delete notification mutation
  const deleteNotificationMutation = useDeleteNotificationsId();

  const notifications = useMemo(() => {
    if (!notificationsQuery.data) return [];
    const data = notificationsQuery.data as any;
    return Array.isArray(data)
      ? data
      : data.notifications || [];
  }, [notificationsQuery.data]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n: any) => !n.read).length;
  }, [notifications]);

  const handleRefresh = useCallback(() => {
    setPage(0);
    notificationsQuery.refetch();
  }, [notificationsQuery]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsReadMutation.mutateAsync({ id: notificationId });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["/notifications/unread-count"],
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [markAsReadMutation, queryClient],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/notifications/unread-count"],
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [markAllAsReadMutation, queryClient]);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotificationMutation.mutateAsync({ id: notificationId });
        queryClient.invalidateQueries({ queryKey: ["/notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["/notifications/unread-count"],
        });
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [deleteNotificationMutation, queryClient],
  );

  const handleNotificationPress = useCallback(
    async (notification: any) => {
      console.log('🔔 Notification pressed:', {
        id: notification.id,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
        event_type: notification.event_type,
        read: notification.read,
      });

      // Navigate or show detail based on notification type
      if (notification.entity_type === "memory" && notification.entity_id) {
        console.log('📖 Opening memory detail:', notification.entity_id);
        // Mostrar el detalle del recuerdo
        setSelectedMemoryId(notification.entity_id);
        setDetailDialogVisible(true);
      } else if (notification.entity_type === "activity" && notification.entity_id) {
        console.log('📅 Opening activity detail:', notification.entity_id);
        // Mostrar el detalle de la actividad
        setSelectedActivityId(notification.entity_id);
        setActivityDetailDialogVisible(true);
      } else {
        console.log('⚠️ No action for this notification type');
      }

      // Mark as read in background (optimistic update)
      if (!notification.read) {
        handleMarkAsRead(notification.id);
      }
      // Add more navigation logic as needed
    },
    [handleMarkAsRead, router],
  );

  const handleLoadMore = useCallback(() => {
    if (
      !notificationsQuery.isFetching &&
      notifications.length >= (page + 1) * PAGE_SIZE
    ) {
      setPage((prev) => prev + 1);
    }
  }, [notificationsQuery.isFetching, notifications.length, page]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  const getNotificationIcon = (eventType: string, entityType?: string) => {
    switch (eventType) {
      case "mention":
        // Diferentes iconos según el tipo de entidad
        if (entityType === "memory") {
          return "image-text";
        } else if (entityType === "activity") {
          return "calendar-text";
        }
        return "at";
      case "activity_created":
        return "calendar-plus";
      case "activity_reminder":
        return "bell-ring";
      default:
        return "bell";
    }
  };

  const renderNotification = useCallback(
    ({ item }: { item: any }) => {
      // Para menciones, detectar si el título contiene formato <@id>
      const hasMention = /<@([^>]+)>/.test(item.title);
      const isMention = item.event_type === "mention" || hasMention;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.notificationCard,
            !item.read && styles.unreadCard,
            pressed && styles.pressedCard,
          ]}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.notificationIconContainer}>
            <MaterialCommunityIcons
              name={getNotificationIcon(item.event_type, item.entity_type)}
              size={24}
              color={item.read ? COLORS.textSecondary : COLORS.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            {isMention ? (
              <HighlightedMentionText
                text={item.title}
                groupMembers={groupMembers}
                style={
                  item.read
                    ? styles.notificationTitle
                    : {
                        fontSize: 14,
                        color: COLORS.text,
                        fontWeight: "700" as const,
                      }
                }
                numberOfLines={2}
              />
            ) : (
              <Text
                style={[
                  styles.notificationTitle,
                  !item.read && styles.unreadTitle,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            )}
            {item.body && typeof item.body === 'string' && item.body.trim() !== '' && (
              <Text style={styles.notificationBody} numberOfLines={2}>
                {item.body}
              </Text>
            )}
            <Text style={styles.notificationDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          <IconButton
            icon="close"
            size={20}
            iconColor={COLORS.textSecondary}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(item.id);
            }}
            style={styles.deleteButton}
          />

          {!item.read && <View style={styles.unreadDot} />}
        </Pressable>
      );
    },
    [handleNotificationPress, handleDeleteNotification, groupMembers],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="bell-outline"
        size={100}
        color={COLORS.textSecondary}
        style={{ opacity: 0.3 }}
      />
      <Text style={styles.emptyTitle}>No hay notificaciones</Text>
      <Text style={styles.emptyText}>
        Te avisaremos cuando tengas algo nuevo
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!notificationsQuery.isFetching) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Manual Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
        
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <Chip
              icon="bell"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {unreadCount} sin leer
            </Chip>
            <Button
              mode="text"
              onPress={handleMarkAllAsRead}
              loading={markAllAsReadMutation.isPending}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              textColor={COLORS.primary}
              compact
              style={styles.markAllButton}
            >
              Marcar todo como leído
            </Button>
          </View>
        )}
      </View>

      {/* Notifications List */}
      {notificationsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => `${item.id}-${item.read}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Dialog para mostrar detalle del recuerdo */}
      <RecuerdoDetailDialog
        visible={detailDialogVisible}
        recuerdo={
          memoryQuery.data && groupMembers
            ? memoryToRecuerdo(
                (memoryQuery.data as any) as Memory,
                groupMembers.reduce((acc, m) => {
                  acc[m.id] = m.displayName;
                  return acc;
                }, {} as Record<string, string>),
              )
            : null
        }
        onDismiss={() => {
          setDetailDialogVisible(false);
          setSelectedMemoryId(null);
        }}
        onUpdateRecuerdo={async () => {
          // Actualizar no está disponible desde notificaciones
          // El usuario debe ir a recuerdos para editar
        }}
        onDeleteRecuerdo={async () => {
          // Eliminar no está disponible desde notificaciones
          // El usuario debe ir a recuerdos para eliminar
        }}
        isMutating={false}
        familyMembers={groupMembers}
        currentUserId={userElepad?.id}
      />

      {/* Dialog para mostrar detalle de la actividad */}
      <Portal>
        <Dialog
          visible={activityDetailDialogVisible}
          onDismiss={() => {
            setActivityDetailDialogVisible(false);
            setSelectedActivityId(null);
          }}
          style={{
            backgroundColor: COLORS.background,
            borderRadius: 16,
            width: "90%",
            alignSelf: "center",
          }}
        >
          {activityQuery.data && (() => {
            const activity = (activityQuery.data as any) as Activity;
            return [
              <Dialog.Title key="title" style={{ fontWeight: "bold", color: COLORS.text }}>
                {activity.title}
              </Dialog.Title>,
              <Dialog.Content key="content">
                  {/* Fecha y hora */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color={COLORS.primary}
                      style={{ marginRight: 12 }}
                    />
                    <Text variant="bodyMedium" style={{ flex: 1, color: COLORS.textSecondary }}>
                      {new Date(activity.startsAt).toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      {new Date(activity.startsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  {/* Creador */}
                  {(() => {
                    const creator = groupMembers.find((m) => m.id === activity.createdBy);
                    return creator ? (
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <MaterialCommunityIcons
                          name="account"
                          size={20}
                          color={COLORS.primary}
                          style={{ marginRight: 12 }}
                        />
                        <Text variant="bodyMedium" style={{ flex: 1, color: COLORS.textSecondary }}>
                          Por: {creator.displayName}
                        </Text>
                      </View>
                    ) : null;
                  })()}

                  {/* Estado */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <MaterialCommunityIcons
                      name={
                        activity.completed
                          ? "checkbox-marked-circle"
                          : "checkbox-blank-circle-outline"
                      }
                      size={20}
                      color={
                        activity.completed
                          ? COLORS.primary
                          : COLORS.textLight
                      }
                      style={{ marginRight: 12 }}
                    />
                    <Text variant="bodyMedium" style={{ flex: 1, color: COLORS.textSecondary }}>
                      {activity.completed ? "Completada" : "Pendiente"}
                    </Text>
                  </View>

                  {/* Descripción */}
                  {activity.description && (
                    <View>
                      <Divider style={{ marginVertical: 12, backgroundColor: COLORS.border }} />
                      <Text
                        variant="labelMedium"
                        style={{
                          color: COLORS.primary,
                          marginBottom: 8,
                          fontWeight: "bold",
                        }}
                      >
                        Descripción
                      </Text>
                      <HighlightedMentionText
                        text={activity.description || ""}
                        groupMembers={groupMembers}
                        style={{ color: COLORS.text, lineHeight: 22, fontSize: 14 }}
                      />
                    </View>
                  )}
                </Dialog.Content>,
              <Dialog.Actions key="actions" style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
                <Button
                    mode="text"
                    onPress={() => {
                      setActivityDetailDialogVisible(false);
                      setSelectedActivityId(null);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => {
                      setActivityDetailDialogVisible(false);
                      setSelectedActivityId(null);
                      // Navegar usando href con el parámetro del tab
                      router.replace({ pathname: "/(tabs)/home", params: { tab: "calendar" } });
                    }}
                    buttonColor={COLORS.primary}
                    style={{ borderRadius: 12 }}
                    contentStyle={{ paddingVertical: 8 }}
                  >
                    Ir al Calendario
                  </Button>
                </Dialog.Actions>
            ];
          })()}
          {!activityQuery.data && (
            <Dialog.Content>
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            </Dialog.Content>
          )}
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    margin: 0,
    marginLeft: -12,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  chip: {
    backgroundColor: COLORS.primary + "15",
    alignSelf: "flex-start",
    height: 32,
  },
  chipText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  markAllButton: {
    marginRight: -8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    position: "relative",
  },
  unreadCard: {
    backgroundColor: COLORS.primary + "10",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pressedCard: {
    opacity: 0.85,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: "700",
    color: COLORS.text,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  deleteButton: {
    margin: 0,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
