import { z } from "@hono/zod-openapi";

export const upsertPushTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["ios", "android"]),
  deviceId: z.string().optional(),
});

export const removePushTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});