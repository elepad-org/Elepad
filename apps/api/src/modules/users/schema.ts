import { z } from "@hono/zod-openapi";

export const User = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().min(1),
    avatarUrl: z.string().url().optional(),
    groupId: z.string().uuid().optional(),
  })
  .openapi("User");
