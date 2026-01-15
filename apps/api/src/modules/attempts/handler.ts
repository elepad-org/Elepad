import { OpenAPIHono, z } from "@hono/zod-openapi";
import { AttemptService } from "./service";
import {
  StartAttemptSchema,
  FinishAttemptSchema,
  AttemptStatsSchema,
  AttemptWithUserSchema,
} from "./schema";
import { GameTypeEnum } from "../puzzles/schema";
import { openApiErrorResponse } from "@/utils/api-error";
import { AchievementService } from "../achievements/service";
import { StreakService } from "../streaks/service";
import { FamilyGroupService } from "../familyGroups/service";

export const attemptsApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    attemptService: AttemptService;
  }
}

attemptsApp.use("/attempts/*", async (c, next) => {
  const attemptService = new AttemptService(c.var.supabase);
  c.set("attemptService", attemptService);
  await next();
});

// Iniciar un nuevo intento
attemptsApp.openapi(
  {
    method: "post",
    path: "/attempts/start",
    tags: ["attempts"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: StartAttemptSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Intento iniciado",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
      404: openApiErrorResponse("Puzzle no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.var.user.id;
    const attempt = await c.var.attemptService.startAttempt(userId, body);
    return c.json({ id: attempt.id }, 201);
  },
);

// Finalizar un intento
attemptsApp.openapi(
  {
    method: "post",
    path: "/attempts/{attemptId}/finish",
    tags: ["attempts"],
    request: {
      params: z.object({ attemptId: z.uuid() }),
      body: {
        content: {
          "application/json": {
            schema: FinishAttemptSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Intento finalizado",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              score: z.number(),
              unlockedAchievements: z
                .array(
                  z.object({
                    id: z.string(),
                    code: z.string(),
                    title: z.string(),
                    description: z.string(),
                    icon: z.string().nullable(),
                    points: z.number(),
                  }),
                )
                .optional(),
            }),
          },
        },
      },
      400: openApiErrorResponse("Intento ya finalizado o datos inválidos"),
      403: openApiErrorResponse("No autorizado"),
      404: openApiErrorResponse("Intento no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { attemptId } = c.req.valid("param");
    const body = c.req.valid("json");
    const userId = c.var.user.id;

    // Finalizar el intento
    const attempt = await c.var.attemptService.finishAttempt(
      attemptId,
      userId,
      body,
    );

    // Verificar y desbloquear logros si el intento fue exitoso
    if (attempt.success) {
      try {
        const achievementService = new AchievementService(c.var.supabase);
        const unlockedAchievements =
          await achievementService.checkAndUnlockAchievements(
            userId,
            attemptId,
          );

        console.log(`🎉 Logros desbloqueados: ${unlockedAchievements.length}`);

        // Actualizar racha del usuario
        try {
          const streakService = new StreakService(c.var.supabase);
          await streakService.updateStreakOnGameCompletion(userId, body.clientDate);
          console.log("🔥 Racha actualizada");
        } catch (streakError) {
          console.error("❌ Error al actualizar racha:", streakError);
          // No fallar la petición si hay error en rachas
        }

        return c.json(
          {
            success: attempt.success || false,
            score: attempt.score || 0,
            unlockedAchievements: unlockedAchievements.map((a) => ({
              id: a.id,
              code: a.code,
              title: a.title,
              description: a.description,
              icon: a.icon,
              points: a.points,
            })),
          },
          200,
        );
      } catch (achievementError) {
        console.error("❌ Error al verificar logros:", achievementError);
        // No fallar la petición si hay error en logros, solo loggear
      }
    }

    return c.json(
      { success: attempt.success || false, score: attempt.score || 0 },
      200,
    );
  },
);

// Obtener un intento por ID
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts/{attemptId}",
    tags: ["attempts"],
    request: {
      params: z.object({ attemptId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Detalles del intento",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
      404: openApiErrorResponse("Intento no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { attemptId } = c.req.valid("param");
    const userId = c.var.user.id;
    const attempt = await c.var.attemptService.getAttemptById(
      attemptId,
      userId,
    );
    return c.json(attempt, 200);
  },
);

// Listar intentos del usuario actual O de un miembro del grupo (para supervisores)
// @ts-expect-error - Complex type inference with Hono + Zod
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts",
    tags: ["attempts"],
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        offset: z.coerce.number().int().min(0).optional().default(0),
        gameType: GameTypeEnum.optional(),
        userId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        description: "Lista de intentos del usuario",
        content: {
          "application/json": { schema: z.array(AttemptWithUserSchema) },
        },
      },
      403: openApiErrorResponse("No tienes permisos para ver los datos de este usuario"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { limit, offset, gameType, userId: requestedUserId } = c.req.valid("query");
    const currentUserId = c.var.user.id;
    
    // Si no especifica userId, usa el usuario actual
    let targetUserId = currentUserId;
    
    // Si especifica userId, verificar permisos
    if (requestedUserId && requestedUserId !== currentUserId) {
      const familyGroupService = new FamilyGroupService(c.var.supabase);
      const canAccess = await familyGroupService.canAccessUserData(currentUserId, requestedUserId);
      
      if (!canAccess) {
        return c.json({ error: { message: "No tienes permisos para ver los datos de este usuario" } }, 403);
      }
      
      targetUserId = requestedUserId;
    }
    
    const attempts = await c.var.attemptService.listUserAttempts(
      targetUserId,
      limit,
      offset,
      gameType as "memory" | "logic" | "attention" | "reaction" | undefined,
    );
    return c.json(attempts, 200);
  },
);

// Obtener estadísticas del usuario O de un miembro del grupo (para supervisores)
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts/stats/{gameType}",
    tags: ["attempts"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
      query: z.object({
        userId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        description: "Estadísticas del usuario para el tipo de juego",
        content: { "application/json": { schema: AttemptStatsSchema } },
      },
      403: openApiErrorResponse("No tienes permisos para ver los datos de este usuario"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const { userId: requestedUserId } = c.req.valid("query");
    const currentUserId = c.var.user.id;
    
    // Si no especifica userId, usa el usuario actual
    let targetUserId = currentUserId;
    
    // Si especifica userId, verificar permisos
    if (requestedUserId && requestedUserId !== currentUserId) {
      const familyGroupService = new FamilyGroupService(c.var.supabase);
      const canAccess = await familyGroupService.canAccessUserData(currentUserId, requestedUserId);
      
      if (!canAccess) {
        return c.json({ error: { message: "No tienes permisos para ver los datos de este usuario" } }, 403);
      }
      
      targetUserId = requestedUserId;
    }
    
    const stats = await c.var.attemptService.getUserStats(targetUserId, gameType);
    return c.json(stats, 200);
  },
);

// Obtener leaderboard global de un tipo de juego
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts/leaderboard/{gameType}",
    tags: ["attempts"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
      query: z.object({
        limit: z.coerce.number().int().min(1).max(50).optional().default(10),
      }),
    },
    responses: {
      200: {
        description: "Leaderboard global del tipo de juego",
        content: {
          "application/json": {
            schema: z.array(z.object({ id: z.string(), score: z.number() })),
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const { limit } = c.req.valid("query");
    const leaderboard = await c.var.attemptService.getLeaderboard(
      gameType,
      limit,
    );
    const formatted = leaderboard.map((item) => ({
      id: item.id,
      score: item.score ?? 0,
    }));
    return c.json(formatted, 200);
  },
);
