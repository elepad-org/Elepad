import { z } from "@hono/zod-openapi";

export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    displayName: z.string().min(1),
    avatarUrl: z.url().nullable(),
    groupId: z.uuid().nullable(),
  })
  .openapi("User");

export type User = z.infer<typeof UserSchema>;

export const UpdateUserSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    avatarUrl: z.string().optional(),
  })
  .strict()
  .openapi("UpdateUser");

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
