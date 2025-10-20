import { z } from "@hono/zod-openapi";

export const ActivitySchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional().nullable(),
    startsAt: z.date(),
    endsAt: z.date().optional().nullable(),
    completed: z.boolean(),
    createdBy: z.uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    frequencyId: z.uuid().optional().nullable(),
  })
  .openapi("Activity");

export type Activity = z.infer<typeof ActivitySchema>;

export const NewActivitySchema = z
  .object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    startsAt: z.string(),
    endsAt: z.string().optional(),
    completed: z.boolean().optional().default(false),
    createdBy: z.uuid(),
    frequencyId: z.uuid().optional().nullable(),
  })
  .openapi("NewActivity");

export type NewActivity = z.infer<typeof NewActivitySchema>;

export const UpdateActivitySchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startsAt: z.string(),
    endsAt: z.string().optional(),
    completed: z.boolean().optional(),
    frequencyId: z.uuid().optional().nullable(),
  })
  .strict()
  .openapi("UpdateActivity");

export type UpdateActivity = z.infer<typeof UpdateActivitySchema>;
