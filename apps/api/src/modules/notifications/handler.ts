import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { NotificationsService } from "./service";
import { getNotificationsQuerySchema, markAsReadParamsSchema } from "./schema";

export const notificationsRouter = new Hono()
  /**
   * Get all notifications for the authenticated user
   */
  .get(
    "/",
    zValidator("query", getNotificationsQuerySchema),
    async (c) => {
      const { limit, offset } = c.req.valid("query");
      const userId = c.get("userId");
      const supabase = c.get("supabase");

      const notificationsService = new NotificationsService(supabase);
      const notifications = await notificationsService.getNotificationsByUser(
        userId,
        limit,
        offset
      );

      return c.json(notifications);
    }
  )

  /**
   * Get count of unread notifications
   */
  .get("/unread-count", async (c) => {
    const userId = c.get("userId");
    const supabase = c.get("supabase");

    const notificationsService = new NotificationsService(supabase);
    const count = await notificationsService.getUnreadCount(userId);

    return c.json({ count });
  })

  /**
   * Mark a notification as read
   */
  .patch(
    "/:id/read",
    zValidator("param", markAsReadParamsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      const supabase = c.get("supabase");

      const notificationsService = new NotificationsService(supabase);
      await notificationsService.markAsRead(id, userId);

      return c.json({ success: true });
    }
  )

  /**
   * Mark all notifications as read
   */
  .patch("/read-all", async (c) => {
    const userId = c.get("userId");
    const supabase = c.get("supabase");

    const notificationsService = new NotificationsService(supabase);
    await notificationsService.markAllAsRead(userId);

    return c.json({ success: true });
  })

  /**
   * Delete a notification
   */
  .delete(
    "/:id",
    zValidator("param", markAsReadParamsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      const supabase = c.get("supabase");

      const notificationsService = new NotificationsService(supabase);
      await notificationsService.deleteNotification(id, userId);

      return c.json({ success: true });
    }
  );
