import { OpenAPIHono, z } from "@hono/zod-openapi";
import { GoogleCalendarService } from "@/services/google-calendar";
import { openApiErrorResponse } from "@/utils/api-error";
import { withAuth } from "@/middleware/auth";

const GoogleAuthSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const oauthApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    googleCalendarService: GoogleCalendarService;
  }
}

// OAuth middleware - provides Google Calendar service
oauthApp.use("/*", async (c, next) => {
  const googleCalendarService = new GoogleCalendarService(c.var.supabase);
  c.set("googleCalendarService", googleCalendarService);
  await next();
});

// Google OAuth authorization endpoint (requires auth)
oauthApp.use("/google-calendar/authorize", withAuth);

oauthApp.openapi(
  {
    method: "post",
    path: "/google-calendar/authorize",
    tags: ["oauth"],
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
      const authUrl = c.var.googleCalendarService.getAuthUrl(userId);

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

// Google OAuth callback endpoint (no auth middleware - uses state parameter)
oauthApp.openapi(
  {
    method: "post",
    path: "/google-calendar/callback",
    tags: ["oauth"],
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
      401: openApiErrorResponse("Estado OAuth inválido"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const { code, state } = body;

    try {
      // Validate state parameter contains a valid user ID
      if (!state || typeof state !== "string") {
        return c.json(
          { error: { message: "Invalid OAuth state parameter" } },
          401,
        );
      }

      // Verify the user exists in Supabase
      const { data: user, error: userError } = await c.var.supabase
        .from("users")
        .select("id")
        .eq("id", state)
        .single();

      if (userError || !user) {
        console.error("Invalid OAuth state - user not found:", state);
        return c.json(
          { error: { message: "Invalid OAuth state - user not found" } },
          401,
        );
      }

      const userId = user.id;

      // Exchange authorization code for tokens
      const tokens =
        await c.var.googleCalendarService.exchangeCodeForTokens(code);

      // Store tokens for user
      await c.var.googleCalendarService.storeTokens(userId, tokens);

      console.log(
        "Successfully stored Google Calendar tokens for user:",
        userId,
      );

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
