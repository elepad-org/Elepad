import { z } from "@hono/zod-openapi";
import { GameTypeEnum } from "../puzzles/schema";

// Schema para un intento/attempt
export const AttemptSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    sudokuPuzzleId: z.uuid().nullable(),
    memoryPuzzleId: z.uuid().nullable(),
    logicPuzzleId: z.uuid().nullable(),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().nullable(),
    durationMs: z.number().int().nullable(),
    score: z.number().int().nullable(),
    success: z.boolean().nullable(),
    moves: z.number().int().nullable(),
    meta: z.record(z.string(), z.any()).nullable(),
    isFocusGame: z.boolean().nullable(),
  })
  .openapi("Attempt");

export type Attempt = z.infer<typeof AttemptSchema>;

// Schema para un intento con información del usuario
export const AttemptWithUserSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    sudokuPuzzleId: z.uuid().nullable(),
    memoryPuzzleId: z.uuid().nullable(),
    logicPuzzleId: z.uuid().nullable(),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().nullable(),
    durationMs: z.number().int().nullable(),
    score: z.number().int().nullable(),
    success: z.boolean().nullable(),
    moves: z.number().int().nullable(),
    meta: z.record(z.string(), z.any()).nullable(),
    isFocusGame: z.boolean().nullable(),
    gameType: z.string().optional(), // Tipo de juego determinado dinámicamente
    user: z.object({
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
    }).optional(), // Información del usuario que jugó
  })
  .openapi("AttemptWithUser");

export type AttemptWithUser = z.infer<typeof AttemptWithUserSchema>;

// Schema para crear un nuevo intento
export const StartAttemptSchema = z
  .object({
    puzzleId: z.uuid(),
    gameType: GameTypeEnum,
  })
  .openapi("StartAttempt");

export type StartAttempt = z.infer<typeof StartAttemptSchema>;

// Schema para finalizar un intento
export const FinishAttemptSchema = z
  .object({
    success: z.boolean(),
    moves: z.number().int().min(0),
    durationMs: z.number().int().min(0),
    score: z.number().int().min(0).optional(),
    meta: z.record(z.string(), z.any()).optional(),
    isFocusGame: z.boolean().optional(), // TODO: revisar
    clientDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Fecha local del cliente YYYY-MM-DD
  })
  .openapi("FinishAttempt");

export type FinishAttempt = z.infer<typeof FinishAttemptSchema>;

// Schema para estadísticas de intentos
export const AttemptStatsSchema = z
  .object({
    totalAttempts: z.number().int(),
    successfulAttempts: z.number().int(),
    failedAttempts: z.number().int(),
    averageDurationMs: z.number().nullable(),
    averageMoves: z.number().nullable(),
    bestScore: z.number().int().nullable(),
    bestTime: z.number().int().nullable(),
    bestMoves: z.number().int().nullable(),
  })
  .openapi("AttemptStats");

export type AttemptStats = z.infer<typeof AttemptStatsSchema>;

// Schema para intento con detalles del puzzle
export const AttemptWithPuzzleSchema = z
  .object({
    attempt: AttemptSchema,
    puzzleTitle: z.string().nullable(),
    gameType: GameTypeEnum,
    gameName: z.string().nullable(),
  })
  .openapi("AttemptWithPuzzle");

export type AttemptWithPuzzle = z.infer<typeof AttemptWithPuzzleSchema>;
