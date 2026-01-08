import { z } from "zod";

// Schema for getting notifications
export const getNotificationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Schema for marking notification as read
export const markAsReadParamsSchema = z.object({
  id: z.string().uuid(),
});

export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;
