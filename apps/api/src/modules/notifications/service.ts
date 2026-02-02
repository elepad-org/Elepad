import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { PushTokensService } from "../pushTokens/service";

export type EventType = "mention" | "achievement" | "activity_reminder" | "activity_assigned" | "reaction";
export type EntityType = "memory" | "activity" | "puzzle" | "achievement";

export interface CreateNotificationParams {
  userId: string;
  actorId?: string;
  eventType: EventType;
  entityType: EntityType;
  entityId: string;
  title: string;
  body?: string;
}

export class NotificationsService {
  private pushTokensService: PushTokensService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.pushTokensService = new PushTokensService(supabase);
  }

  /**
   * Send push notification to a user
   */
  private async sendPushNotification(userId: string, title: string, body?: string, data?: Record<string, unknown>): Promise<void> {
    try {
      const pushTokens = await this.pushTokensService.getPushTokensByUser(userId);

      if (pushTokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return;
      }

      const messages = pushTokens.map(token => ({
        to: token.token,
        title,
        body: body || "",
        data: data || {},
        sound: "default" as const,
        priority: "default" as const,
      }));

      // Send to Expo push service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.error('Failed to send push notification:', await response.text());
        return;
      }

      const result = await response.json();
      console.log(`Push notification sent to ${pushTokens.length} device(s) for user ${userId}`);

      // Handle errors per token
      if (result.data && Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (i < pushTokens.length) {
            const token = pushTokens[i]!.token;

            if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
              console.log(`Deactivating invalid token: ${token}`);
              await this.pushTokensService.removePushToken(userId, token);
            } else if (ticket.status === 'error') {
              console.error(`Push notification error for token ${token}:`, ticket.details);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Don't throw - push notifications are not critical
    }
  }

  /**
   * Create a notification for a user
   */
  async createNotification(
    params: CreateNotificationParams
  ): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        actor_id: params.actorId || null,
        event_type: params.eventType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        title: params.title,
        body: params.body || null,
      });

    if (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }

    // Send push notification
    await this.sendPushNotification(params.userId, params.title, params.body, {
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
    });
  }

  /**
   * Create multiple notifications in a single batch
   */
  async createNotifications(
    notifications: CreateNotificationParams[]
  ): Promise<void> {
    if (notifications.length === 0) return;

    const notificationsToInsert = notifications.map((notif) => ({
      user_id: notif.userId,
      actor_id: notif.actorId || null,
      event_type: notif.eventType,
      entity_type: notif.entityType,
      entity_id: notif.entityId,
      title: notif.title,
      body: notif.body || null,
    }));

    const { error } = await this.supabase
      .from("notifications")
      .insert(notificationsToInsert);

    if (error) {
      console.error("Error creating notifications:", error);
      throw new Error("Failed to create notifications");
    }

    // Send push notifications for each notification
    const pushPromises = notifications.map(notif =>
      this.sendPushNotification(notif.userId, notif.title, notif.body, {
        eventType: notif.eventType,
        entityType: notif.entityType,
        entityId: notif.entityId,
      })
    );

    await Promise.all(pushPromises);
  }

  /**
   * Get all notifications for a user
   */
  async getNotificationsByUser(
    userId: string,
    limit = 50,
    offset = 0
  ) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching notifications:", error);
      throw new Error("Failed to fetch notifications");
    }

    return data || [];
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error getting unread count:", error);
      throw new Error("Failed to get unread count");
    }

    return count || 0;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Create notifications for mentioned users in a memory
   */
  async notifyMentionedUsers(
    mentionedUserIds: string[],
    actorId: string,
    actorName: string,
    entityType: EntityType,
    entityId: string,
    entityTitle: string
  ): Promise<void> {
    // Filter out the actor from the mentioned users (don't notify yourself)
    const usersToNotify = mentionedUserIds.filter((id) => id !== actorId);

    if (usersToNotify.length === 0) return;

    // Crear mensaje dinámico según el tipo de entidad
    let titleMessage = "";
    if (entityType === "memory") {
      titleMessage = `${actorName} te mencionó en un recuerdo`;
    } else if (entityType === "activity") {
      titleMessage = `${actorName} te mencionó en una actividad`;
    } else {
      titleMessage = `${actorName} te mencionó`;
    }

    const notifications: CreateNotificationParams[] = usersToNotify.map((userId) => ({
      userId,
      actorId,
      eventType: "mention" as EventType,
      entityType,
      entityId,
      title: titleMessage,
      body: entityTitle,
    }));

    await this.createNotifications(notifications);
  }
}
