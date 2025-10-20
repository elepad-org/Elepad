import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { ActivityCompletionService } from "./service";
import { withAuth } from "../../middleware/auth";
import {
  NewActivityCompletionSchema,
  GetActivityCompletionsQuerySchema,
  ActivityCompletionSchema,
} from "./schema";
import { ApiError } from "../../utils/api-error";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase-types";

export const activityCompletionsHandler = new OpenAPIHono<{
  Variables: {
    user: User;
    supabase: SupabaseClient<Database>;
  };
}>();

// Aplicar autenticación a todas las rutas
activityCompletionsHandler.use("/*", withAuth);

// Esquema de respuestas comunes
const ErrorSchema = z.object({
  error: z.string(),
});

// Ruta GET /activity-completions
const getCompletionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["ActivityCompletions"],
  summary: "Obtener completaciones del usuario",
  request: {
    query: GetActivityCompletionsQuerySchema,
  },
  responses: {
    200: {
      description: "Lista de completaciones",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(ActivityCompletionSchema),
          }),
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

activityCompletionsHandler.openapi(getCompletionsRoute, async (c) => {
  try {
    const user = c.get("user");
    const supabase = c.get("supabase");
    const query = c.req.valid("query");

    const service = new ActivityCompletionService(supabase);
    const completions = await service.getCompletions(user.id, query);

    return c.json({ data: completions }, 200);
  } catch (error) {
    console.error("Error fetching completions:", error);
    throw new ApiError("Error al obtener completaciones", 500);
  }
});

// Ruta POST /activity-completions/toggle
const toggleCompletionRoute = createRoute({
  method: "post",
  path: "/toggle",
  tags: ["ActivityCompletions"],
  summary: "Toggle completación de actividad para un día",
  request: {
    body: {
      content: {
        "application/json": {
          schema: NewActivityCompletionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Resultado del toggle",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              completed: z.boolean(),
              completion: ActivityCompletionSchema.nullable(),
            }),
          }),
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
    },
  },
});

activityCompletionsHandler.openapi(toggleCompletionRoute, async (c) => {
  try {
    const user = c.get("user");
    const supabase = c.get("supabase");
    const data = c.req.valid("json");

    const service = new ActivityCompletionService(supabase);
    const result = await service.toggleCompletion(user.id, data);

    return c.json({ data: result }, 200);
  } catch (error) {
    console.error("Error toggling completion:", error);
    throw new ApiError("Error al cambiar completación", 500);
  }
});
