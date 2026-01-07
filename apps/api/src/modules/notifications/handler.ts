import { OpenAPIHono, z } from "@hono/zod-openapi";
import { NotificationsService } from "./service";
import { getNotificationsQuerySchema, markAsReadParamsSchema } from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const notificationsApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    notificationsService: NotificationsService;
  }
}

// Middleware para inyectar el NotificationsService en cada request
notificationsApp.use("/notifications/*", async (c, next) => {
  const notificationsService = new NotificationsService(c.var.supabase);
  c.set("notificationsService", notificationsService);
  await next();
});

// GET /notifications - Get all notifications for the authenticated user
notificationsApp.openapi(
  {
    method: "get",
    path: "/notifications",
    tags: ["notifications"],
    summary: "Get user notifications",
    request: {
      query: getNotificationsQuerySchema,
    },
    responses: {
      200: {
        description: "List of notifications",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string().uuid(),
                user_id: z.string().uuid(),
                actor_id: z.string().uuid().nullable(),
                event_type: z.string(),
                entity_type: z.string(),
                entity_id: z.string().uuid(),
                title: z.string().nullable(),
                body: z.string().nullable(),
                read: z.boolean(),
                created_at: z.string(),
              })
            ),
          },
        },
      },
      ...openApiErrorResponse,
    },
  },
  async (c) => {
    const { limit, offset } = c.req.valid("query");
    const userId = c.var.user.id;

    const notifications = await c.var.notificationsService.getNotificationsByUser(
      userId,
      limit,
      offset
    );

    return c.json(notifications);
  }
)

// Get count of unread notifications
  .openapi(
    {
      method: "get",
      path: "/notifications/unread-count",
      tags: ["notifications"],
      summary: "Get unread notifications count",
      responses: {
        200: {
          description: "Unread count",
          content: {
            "application/json": {
              schema: z.object({
                count: z.number(),
              }),
            },
          },
        },
        ...openApiErrorResponse,
      },
    },
    async (c) => {
      const userId = c.var.user.id;

      const count = await c.var.notificationsService.getUnreadCount(userId);

      return c.json({ count });
    }
  )

// Mark a notification as read
  .openapi(
    {
      method: "patch",
      path: "/notifications/{id}/read",
      tags: ["notifications"],
      summary: "Mark notification as read",
      request: {
        params: markAsReadParamsSchema,
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
              }),
            },
          },
        },
        ...openApiErrorResponse,
      },
    },
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      await c.var.notificationsService.markAsRead(id, userId);

      return c.json({ success: true });
    }
  )

// Mark all notifications as read
  .openapi(
    {
      method: "patch",
      path: "/notifications/read-all",
      tags: ["notifications"],
      summary: "Mark all notifications as read",
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
              }),
            },
          },
        },
        ...openApiErrorResponse,
      },
    },
    async (c) => {
      const userId = c.var.user.id;

      await c.var.notificationsService.markAllAsRead(userId);

      return c.json({ success: true });
    }
  )

// Delete a notification
  .openapi(
    {
      method: "delete",
      path: "/notifications/{id}",
      tags: ["notifications"],
      summary: "Delete a notification",
      request: {
        params: markAsReadParamsSchema,
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
              }),
            },
          },
        },
        ...openApiErrorResponse,
      },
    },
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      await c.var.notificationsService.deleteNotification(id, userId);

      return c.json({ success: true });
    }
  );
