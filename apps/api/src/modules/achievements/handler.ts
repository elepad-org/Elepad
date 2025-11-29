import { OpenAPIHono, z } from "@hono/zod-openapi";
import { AchievementService } from "./service";
import { AchievementProgressSchema } from "./schema";
import { GameTypeEnum } from "../puzzles/schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const achievementsApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    achievementService: AchievementService;
  }
}

achievementsApp.use("/achievements/*", async (c, next) => {
  const achievementService = new AchievementService(c.var.supabase);
  c.set("achievementService", achievementService);
  await next();
});

// Listar logros de un tipo de juego
achievementsApp.openapi(
  {
    method: "get",
    path: "/achievements/{gameType}",
    tags: ["achievements"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
    },
    responses: {
      200: {
        description: "Lista de logros del tipo de juego",
        content: {
          "application/json": {
            schema: z.array(z.object({ id: z.string(), title: z.string() })),
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const achievements =
      await c.var.achievementService.listAchievementsByGameType(gameType);
    return c.json(achievements, 200);
  },
);

// Listar logros con estado de desbloqueo del usuario
achievementsApp.openapi(
  {
    method: "get",
    path: "/achievements/user/{gameType}",
    tags: ["achievements"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
    },
    responses: {
      200: {
        description:
          "Lista de logros con información de si el usuario los desbloqueó",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                achievement: z.object({
                  id: z.string(),
                  title: z.string(),
                  description: z.string(),
                  icon: z.string().nullable(),
                  points: z.number(),
                  gameType: GameTypeEnum,
                  code: z.string(),
                }),
                unlocked: z.boolean(),
                unlockedAt: z.string().nullable(),
              }),
            ),
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const userId = c.var.user.id;
    const achievements =
      await c.var.achievementService.listAchievementsWithUnlockStatus(
        userId,
        gameType,
      );
    return c.json(achievements, 200);
  },
);

// Obtener progreso de logros del usuario
achievementsApp.openapi(
  {
    method: "get",
    path: "/achievements/progress/{gameType}",
    tags: ["achievements"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
    },
    responses: {
      200: {
        description: "Progreso de logros del usuario",
        content: {
          "application/json": { schema: AchievementProgressSchema },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const userId = c.var.user.id;
    const progress = await c.var.achievementService.getUserAchievementProgress(
      userId,
      gameType,
    );
    return c.json(progress, 200);
  },
);

// Verificar y desbloquear logros basados en un intento
achievementsApp.openapi(
  {
    method: "post",
    path: "/achievements/check/{attemptId}",
    tags: ["achievements"],
    request: {
      params: z.object({ attemptId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Logros desbloqueados (si hay alguno)",
        content: {
          "application/json": {
            schema: z.array(z.object({ id: z.string(), title: z.string() })),
          },
        },
      },
      404: openApiErrorResponse("Intento no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { attemptId } = c.req.valid("param");
    const userId = c.var.user.id;
    console.log(
      `🔍 Verificando logros para attemptId: ${attemptId}, userId: ${userId}`,
    );
    const unlockedAchievements =
      await c.var.achievementService.checkAndUnlockAchievements(
        userId,
        attemptId,
      );
    console.log(`🏆 Logros desbloqueados:`, unlockedAchievements);
    return c.json(unlockedAchievements, 200);
  },
);
