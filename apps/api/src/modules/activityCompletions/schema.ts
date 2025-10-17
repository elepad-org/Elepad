import { z } from "zod";

// Schema para ActivityCompletion
export const ActivityCompletionSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  userId: z.string().uuid(),
  completedDate: z.string(), // YYYY-MM-DD
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActivityCompletion = z.infer<typeof ActivityCompletionSchema>;

// Schema para crear una nueva completación
export const NewActivityCompletionSchema = z.object({
  activityId: z.string().uuid(),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export type NewActivityCompletion = z.infer<typeof NewActivityCompletionSchema>;

// Schema para obtener completaciones (query params)
export const GetActivityCompletionsQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  activityId: z.string().uuid().optional(),
});

export type GetActivityCompletionsQuery = z.infer<
  typeof GetActivityCompletionsQuerySchema
>;
