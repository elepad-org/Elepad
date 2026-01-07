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
  Notification,
} from "@elepad/api-client";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import HighlightedMentionText from "@/components/Recuerdos/HighlightedMentionText";

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userElepad } = useAuth();
  const [page, setPage] = useState(0);

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
        refetchOnWindowFocus: true,
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
    return Array.isArray(notificationsQuery.data)
      ? notificationsQuery.data
      : notificationsQuery.data.notifications || [];
  }, [notificationsQuery.data]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
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
    async (notification: Notification) => {
      // Mark as read if not already read
      if (!notification.read) {
        await handleMarkAsRead(notification.id);
      }

      // Navigate based on notification type
      if (notification.entityType === "memory") {
        router.push("/(tabs)/recuerdos");
      } else if (notification.entityType === "activity") {
        router.push("/(tabs)/calendar");
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
    const date = new Date(dateString);
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

  const getNotificationIcon = (eventType: string) => {
    switch (eventType) {
      case "mention":
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
    ({ item }: { item: Notification }) => {
      // Para menciones, detectar si el título contiene formato <@id>
      const hasMention = /<@([^>]+)>/.test(item.title);
      const isMention = item.eventType === "mention" || hasMention;

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
              name={getNotificationIcon(item.eventType)}
              size={24}
              color={item.read ? COLORS.textSecondary : COLORS.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            {isMention ? (
              <HighlightedMentionText
                text={item.title}
                groupMembers={groupMembers}
                style={[
                  styles.notificationTitle,
                  !item.read && styles.unreadTitle,
                ]}
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
              {formatDate(item.createdAt)}
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
      <Stack.Screen
        options={{
          title: "Notificaciones",
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header Actions */}
      {notifications.length > 0 && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {unreadCount > 0 && (
              <Chip
                icon="bell"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                {unreadCount} sin leer
              </Chip>
            )}
          </View>
          {unreadCount > 0 && (
            <Button
              mode="text"
              onPress={handleMarkAllAsRead}
              loading={markAllAsReadMutation.isPending}
              disabled={markAllAsReadMutation.isPending}
              textColor={COLORS.primary}
              compact
            >
              Marcar todo como leído
            </Button>
          )}
        </View>
      )}

      {/* Notifications List */}
      {notificationsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  chip: {
    backgroundColor: COLORS.primary + "15",
  },
  chipText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.card,
    position: "relative",
  },
  unreadCard: {
    backgroundColor: COLORS.primary + "05",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  pressedCard: {
    opacity: 0.7,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
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
    marginTop: -8,
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
