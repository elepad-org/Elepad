import { OpenAPIHono, z } from "@hono/zod-openapi";
import { StreakService } from "./service";
import {
  UserStreakSchema,
  StreakHistorySchema,
  StreakHistoryQuerySchema,
} from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const streaksApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    streakService: StreakService;
  }
}

streaksApp.use("/streaks/*", async (c, next) => {
  const streakService = new StreakService(c.var.supabase);
  c.set("streakService", streakService);
  await next();
});

// GET /streaks/me - Obtener racha actual del usuario
streaksApp.openapi(
  {
    method: "get",
    path: "/streaks/me",
    tags: ["streaks"],
    responses: {
      200: {
        description: "Racha del usuario",
        content: {
          "application/json": {
            schema: UserStreakSchema,
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const streak = await c.var.streakService.getUserStreak(userId);
    return c.json(streak);
  },
);

// GET /streaks/history - Obtener historial de días jugados
streaksApp.openapi(
  {
    method: "get",
    path: "/streaks/history",
    tags: ["streaks"],
    request: {
      query: StreakHistoryQuerySchema,
    },
    responses: {
      200: {
        description: "Historial de días jugados",
        content: {
          "application/json": {
            schema: StreakHistorySchema,
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const { startDate, endDate } = c.req.valid("query");
    const history = await c.var.streakService.getStreakHistory(
      userId,
      startDate,
      endDate,
    );
    return c.json(history);
  },
);
