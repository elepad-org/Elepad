import { OpenAPIHono, z } from "@hono/zod-openapi";
import { ActivityService } from "./service";
import {
  ActivitySchema,
  NewActivitySchema,
  UpdateActivitySchema,
} from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";
import { GoogleCalendarService } from "@/services/google-calendar";
import { withAuth } from "@/middleware/auth";

const GoogleAuthSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const activitiesApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    activityService: ActivityService;
    googleCalendarService: GoogleCalendarService;
  }
}

// Aplicar autenticación a todas las rutas
activitiesApp.use("/*", withAuth);

activitiesApp.use("/activities/*", async (c, next) => {
  const activityService = new ActivityService(c.var.supabase);
  const googleCalendarService = new GoogleCalendarService(c.var.supabase);
  c.set("activityService", activityService);
  c.set("googleCalendarService", googleCalendarService);
  await next();
});

activitiesApp.openapi(
  {
    method: "get",
    path: "/activities/{id}",
    tags: ["activities"],
    request: { params: z.object({ id: z.uuid() }) },
    responses: {
      200: {
        description: "Actividad",
        content: { "application/json": { schema: ActivitySchema } },
      },
      404: openApiErrorResponse("Actividad no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const event = await c.var.activityService.getActivityById(id);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "get",
    path: "/activities/familyCode/{idFamilyGroup}",
    tags: ["activities"],
    request: { params: z.object({ idFamilyGroup: z.uuid() }) },
    responses: {
      200: {
        description: "Actividad",
        content: { "application/json": { schema: z.array(ActivitySchema) } },
      },
      404: openApiErrorResponse("Actividad no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { idFamilyGroup } = c.req.valid("param");
    const event =
      await c.var.activityService.getActivitiesWithFamilyCode(idFamilyGroup);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "post",
    path: "/activities",
    tags: ["activities"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewActivitySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Actividad creada",
        content: { "application/json": { schema: ActivitySchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const event = await c.var.activityService.create(body);
    return c.json(event, 201);
  },
);

activitiesApp.openapi(
  {
    method: "patch",
    path: "/activities/{id}",
    tags: ["activities"],
    request: {
      params: z.object({ id: z.uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateActivitySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Actividad actualizada",
        content: { "application/json": { schema: ActivitySchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      404: openApiErrorResponse("Actividad no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const event = await c.var.activityService.update(id, body);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "delete",
    path: "/activities/{id}",
    tags: ["activities"],
    request: { params: z.object({ id: z.uuid() }) },
    responses: {
      204: {
        description: "Actividad eliminada",
      },
      404: openApiErrorResponse("Actividad no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const event = await c.var.activityService.remove(id);
    return c.json(event, 200);
  },
);

// Google Calendar endpoints
activitiesApp.openapi(
  {
    method: "post",
    path: "/activities/google-calendar/enable",
    tags: ["activities"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ calendarId: z.string().optional() }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Google Calendar enabled",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      400: openApiErrorResponse("Error al habilitar Google Calendar"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    try {
      // Check if user has Google Calendar tokens
      const { data: tokens, error } = await c.var.supabase.rpc(
        "get_google_tokens",
        {
          p_user_id: userId,
        },
      );

      console.log("Tokens check for user", userId, ":", { tokens, error });

      if (!tokens || tokens.length === 0) {
        return c.json(
          {
            error: {
              message:
                "Google Calendar authorization required. Please complete OAuth first.",
            },
          },
          400,
        );
      }

      await c.var.googleCalendarService.enableGoogleCalendar(
        userId,
        body.calendarId,
      );

      // Sync existing activities when enabling Google Calendar
      await c.var.googleCalendarService.syncExistingActivities(userId, c);

      return c.json({ success: true }, 200);
    } catch (error) {
      console.error("Error enabling Google Calendar:", error);
      return c.json(
        { error: { message: "Failed to enable Google Calendar" } },
        400,
      );
    }
  },
);

activitiesApp.openapi(
  {
    method: "post",
    path: "/activities/google-calendar/disable",
    tags: ["activities"],
    responses: {
      200: {
        description: "Google Calendar disabled",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      400: openApiErrorResponse("Error al deshabilitar Google Calendar"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;

    try {
      await c.var.googleCalendarService.disableGoogleCalendar(userId);
      return c.json({ success: true }, 200);
    } catch (error) {
      console.error("Error disabling Google Calendar:", error);
      return c.json(
        { error: { message: "Failed to disable Google Calendar" } },
        400,
      );
    }
  },
);

activitiesApp.openapi(
  {
    method: "get",
    path: "/activities/google-calendar/status",
    tags: ["activities"],
    responses: {
      200: {
        description: "Google Calendar status",
        content: {
          "application/json": {
            schema: z.object({
              enabled: z.boolean(),
              calendarId: z.string().optional(),
            }),
          },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;

    try {
      const enabled =
        await c.var.googleCalendarService.isGoogleCalendarEnabled(userId);
      return c.json({ enabled, calendarId: undefined }, 200);
    } catch (error) {
      console.error("Error checking Google Calendar status:", error);
      return c.json({ enabled: false, calendarId: undefined }, 200);
    }
  },
);

// Google OAuth authorization endpoint
activitiesApp.openapi(
  {
    method: "post",
    path: "/activities/google-calendar/authorize",
    tags: ["activities"],
    responses: {
      200: {
        description: "Google OAuth authorization URL",
        content: {
          "application/json": { schema: z.object({ authUrl: z.string() }) },
        },
      },
      400: openApiErrorResponse("Error al generar URL de autorización"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;

    try {
      const googleCalendarService = new GoogleCalendarService(c.var.supabase);
      const authUrl = googleCalendarService.getAuthUrl(userId);

      return c.json({ authUrl }, 200);
    } catch (error) {
      console.error("Error generating Google OAuth URL:", error);
      return c.json(
        { error: { message: "Failed to generate authorization URL" } },
        400,
      );
    }
  },
);

// Google OAuth callback endpoint
activitiesApp.openapi(
  {
    method: "post",
    path: "/activities/google-calendar/callback",
    tags: ["activities"],
    request: {
      body: {
        content: {
          "application/json": { schema: GoogleAuthSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Google OAuth callback handled",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      400: openApiErrorResponse("Error al procesar callback de Google OAuth"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    try {
      const googleCalendarService = new GoogleCalendarService(c.var.supabase);

      // Exchange authorization code for tokens
      const tokens = await googleCalendarService.exchangeCodeForTokens(
        body.code,
      );

      // Store tokens for user
      await googleCalendarService.storeTokens(userId, tokens);

      return c.json({ success: true }, 200);
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      return c.json(
        { error: { message: "Failed to process Google OAuth callback" } },
        400,
      );
    }
  },
);
