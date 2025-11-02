import { OpenAPIHono, z } from "@hono/zod-openapi";
import { AttemptService } from "./service";
import {
  AttemptSchema,
  StartAttemptSchema,
  FinishAttemptSchema,
  AttemptStatsSchema,
} from "./schema";
import { GameTypeEnum } from "../puzzles/schema";
import { openApiErrorResponse } from "@/utils/api-error";

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
      params: z.object({ attemptId: z.string().uuid() }),
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
            schema: z.object({ success: z.boolean(), score: z.number() }),
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
    const attempt = await c.var.attemptService.finishAttempt(
      attemptId,
      userId,
      body,
    );
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

// Listar intentos del usuario actual
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts",
    tags: ["attempts"],
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      }),
    },
    responses: {
      200: {
        description: "Lista de intentos del usuario",
        content: {
          "application/json": { schema: z.array(z.object({ id: z.string() })) },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { limit } = c.req.valid("query");
    const userId = c.var.user.id;
    const attempts = await c.var.attemptService.listUserAttempts(userId, limit);
    return c.json(attempts, 200);
  },
);

// Obtener estadísticas del usuario para un tipo de juego
attemptsApp.openapi(
  {
    method: "get",
    path: "/attempts/stats/{gameType}",
    tags: ["attempts"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
    },
    responses: {
      200: {
        description: "Estadísticas del usuario para el tipo de juego",
        content: { "application/json": { schema: AttemptStatsSchema } },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const userId = c.var.user.id;
    const stats = await c.var.attemptService.getUserStats(userId, gameType);
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
