import { z } from "zod";

// Schema para la racha del usuario
export const UserStreakSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastPlayedDate: z.string().date().nullable(),
});

export type UserStreak = z.infer<typeof UserStreakSchema>;

// Schema para el historial de días jugados
export const StreakHistorySchema = z.object({
  dates: z.array(z.string().date()),
});

export type StreakHistory = z.infer<typeof StreakHistorySchema>;

// Schema para query params del historial
export const StreakHistoryQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export type StreakHistoryQuery = z.infer<typeof StreakHistoryQuerySchema>;
