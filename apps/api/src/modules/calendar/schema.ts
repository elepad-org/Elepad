import { z } from "@hono/zod-openapi";

export const GenerateCalendarBodySchema = z
  .object({
    userId: z.uuid({ message: "userId debe ser un UUID válido" }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate debe tener formato YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate debe tener formato YYYY-MM-DD"),
  })
  .openapi("GenerateCalendarBody");

export type GenerateCalendarBody = z.infer<typeof GenerateCalendarBodySchema>;

export const GenerateCalendarResponseSchema = z
  .object({
    calendarId: z.uuid(),
    feedUrl: z.string().url(),
    message: z.string(),
  })
  .openapi("GenerateCalendarResponse");
