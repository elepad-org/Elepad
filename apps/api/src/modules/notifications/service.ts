import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";

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
  constructor(private supabase: SupabaseClient<Database>) {}

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
      titleMessage = `<@${actorId}> te mencionó en un recuerdo`;
    } else if (entityType === "activity") {
      titleMessage = `<@${actorId}> te mencionó en una actividad`;
    } else {
      titleMessage = `<@${actorId}> te mencionó`;
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
