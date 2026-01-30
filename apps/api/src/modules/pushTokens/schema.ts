import { z } from "@hono/zod-openapi";

export const upsertPushTokenSchema = z.object({
  expo_push_token: z.string().min(1, "Expo push token is required"),
  platform: z.enum(["ios", "android"]),
  device_id: z.string().optional(),
});

export const removePushTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});