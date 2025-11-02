import { z } from "@hono/zod-openapi";
import { GameTypeEnum } from "../puzzles/schema";

// Schema para un logro/achievement
export const AchievementSchema = z
  .object({
    id: z.string().uuid(),
    gameType: GameTypeEnum,
    code: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string().nullable(),
    condition: z.record(z.string(), z.any()),
    points: z.number().int(),
    createdAt: z.string().datetime(),
  })
  .openapi("Achievement");

export type Achievement = z.infer<typeof AchievementSchema>;

// Schema para logro desbloqueado por el usuario
export const UserAchievementSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    achievementId: z.string().uuid(),
    unlockedAt: z.string().datetime(),
  })
  .openapi("UserAchievement");

export type UserAchievement = z.infer<typeof UserAchievementSchema>;

// Schema para logro con información de desbloqueo
export const AchievementWithUnlockSchema = z
  .object({
    achievement: AchievementSchema,
    unlocked: z.boolean(),
    unlockedAt: z.string().datetime().nullable(),
  })
  .openapi("AchievementWithUnlock");

export type AchievementWithUnlock = z.infer<typeof AchievementWithUnlockSchema>;

// Schema para progreso de logros del usuario
export const AchievementProgressSchema = z
  .object({
    totalAchievements: z.number().int(),
    unlockedAchievements: z.number().int(),
    totalPoints: z.number().int(),
    earnedPoints: z.number().int(),
  })
  .openapi("AchievementProgress");

export type AchievementProgress = z.infer<typeof AchievementProgressSchema>;
