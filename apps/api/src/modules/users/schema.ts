import {z} from "@hono/zod-openapi";

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(1),
  fullname: z.string().min(1),
  created_at: z.string().datetime(),
  birth_date: z.string().datetime().optional(),
}).openapi("User");

export const CreateUserInput = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  fullname: z.string().min(1),
  birth_date: z.string().datetime().optional(),
  password : z.string().min(1)
}).openapi("CreateUserInput");