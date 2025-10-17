import { z } from "@hono/zod-openapi";

export const FrequencySchema = z
  .object({
    id: z.uuid(),
    label: z.string().min(1, "El label es obligatorio"),
    rrule: z.string().nullable().optional(),
  })
  .openapi("Frequency");

export type Frequency = z.infer<typeof FrequencySchema>;

export const NewFrequencySchema = z
  .object({
    label: z.string().min(1, "El label es obligatorio"),
    rrule: z.string().optional(),
  })
  .openapi("NewFrequency");

export type NewFrequency = z.infer<typeof NewFrequencySchema>;
