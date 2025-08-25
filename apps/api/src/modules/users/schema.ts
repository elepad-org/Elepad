import { z } from "@hono/zod-openapi";

export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    displayName: z.string().min(1),
    avatarUrl: z.url().optional(),
    groupId: z.uuid().optional(),
  })
  .openapi("User");

export type User = z.infer<typeof UserSchema>;

export const UpdateUserInput = z
  .object({
    displayName: z.string().min(1).optional(),
    avatarUrl: z.string().optional(),
  })
  .strict()
  .openapi("UpdateUserInput");
