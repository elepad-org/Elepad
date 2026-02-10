import { OpenAPIHono } from "@hono/zod-openapi";
import { withHeaders } from "./middleware/headers.js";
import { healthApp } from "./modules/health.js";
import { usersApp } from "./modules/users/handler.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { familyGroupApp } from "./modules/familyGroups/handler.js";
import { activitiesApp } from "./modules/activities/handler.js";
import { Database } from "./supabase-types.js";
import { memoriesApp } from "./modules/memories/handler.js";
import { shopApp } from "./modules/shop/handler.js";
import { frequenciesApp } from "./modules/frequencies/handler.js";
import { activityCompletionsHandler } from "./modules/activityCompletions/handler.js";
import { puzzlesApp } from "./modules/puzzles/handler.js";
import { attemptsApp } from "./modules/attempts/handler.js";
import { achievementsApp } from "./modules/achievements/handler.js";
import { streaksApp } from "./modules/streaks/handler.js";
import { withAuth } from "./middleware/auth.js";
import { notificationsApp } from "./modules/notifications/handler.js";
import { albumApp } from "./modules/memoriesAlbum/handler.js";
import { pushTokensApp } from "./modules/pushTokens/handler.js";
import { ScheduledEvent, ExecutionContext } from "@cloudflare/workers-types";

// Configurar fetch personalizado para Node.js en desarrollo
let customFetch: typeof fetch | undefined;
if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
  try {
    const https = await import("https");
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    customFetch = (url, options) => {
      const isHttps = typeof url === "string" && url.startsWith("https");
      if (isHttps) {
        return fetch(url, {
          ...options,
          // @ts-expect-error - agent is not in the type definitions but works in Node.js
          agent,
        });
      }
      return fetch(url, options);
    };
  } catch {
    // Si falla la importación (por ejemplo, en Cloudflare Workers), usar fetch normal
    customFetch = undefined;
  }
}

export const app = new OpenAPIHono();

// Global middleware.
app.use(logger());
app.use("*", withHeaders);
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Log errors globally.
app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json(err, 500);
});

// Add type definitions to the Hono context. See: https://hono.dev/docs/api/context#contextvariablemap.
declare module "hono" {
  interface ContextVariableMap {
    /** A supabase client will be available in the context of every request. */
    supabase: SupabaseClient<Database>;
    /** The authenticated user from Supabase Auth (available after withAuth middleware). */
    user: { id: string };
    /** The authenticated user ID (available after withAuth middleware). */
    userId: string;
  }
}

// Add a supabase client to each request context.
app.use("*", async (c, next) => {
  // `env` from 'hono/adapter' can read env variables in a Supabase Edge Function.
  const {
    SUPABASE_URL = "https://sdnmoweppzszpxyggdyg.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY,
  } = env<{
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }>(c);

  const supabaseOptions = customFetch
    ? { global: { fetch: customFetch } }
    : undefined;

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    supabaseOptions,
  );
  c.set("supabase", supabase);
  await next();
});

// Mount routes.
app.route("/", healthApp);
app.route("/", usersApp);
app.route("/", familyGroupApp);
app.route("/", activitiesApp);
app.route("/", memoriesApp);
app.route("/", albumApp);
app.route("/", frequenciesApp);
app.route("/activity-completions", activityCompletionsHandler);

// Mount games/puzzles routes (public)
app.route("/", puzzlesApp);

// Mount attempts and achievements routes (require auth)
app.use("/attempts/*", withAuth);
app.route("/", attemptsApp);

app.use("/achievements/*", withAuth);
app.route("/", achievementsApp);

app.use("/streaks/*", withAuth);
app.route("/", streaksApp);

app.use("/notifications/*", withAuth);
app.route("/", notificationsApp);

app.use("/push-tokens/*", withAuth);
app.use("/devices/*", withAuth);
app.route("/", pushTokensApp);

app.use("/shop/*", withAuth);
app.route("/", shopApp);

// OpenAPI spec.
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
  tags: [
    { name: "users" },
    { name: "memories" },
    { name: "album" },
    { name: "familyGroups" },
    { name: "frequencies" },
    { name: "ActivityCompletions" },
    { name: "games" },
    { name: "puzzles" },
    { name: "attempts" },
    { name: "achievements" },
    { name: "streaks" },
    { name: "notifications" },
    { name: "push-tokens" },
  ],
});

// Serve OpenAPI documentation with SwaggerUI.
app.get("/", swaggerUI({ url: "./openapi.json" }));

// Export both the app and a scheduled function following Hono's recommended pattern for Cloudflare Workers
export default {
  // The Hono app handles regular HTTP requests
  fetch: app.fetch,

  /**
   * Cron job to send notifications for pending activities
   * Runs every hour
   * Sends notifications for activities pending in the next 2 hours window (e.g., at 15:00 notifies about 16:00-17:00 activities)
   */
  async scheduled(
    event: ScheduledEvent,
    env: {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    },
    ctx: ExecutionContext,
  ): Promise<void> {
    try {
      const supabaseOptions = customFetch
        ? { global: { fetch: customFetch } }
        : undefined;

      const supabase = createClient(
        env.SUPABASE_URL || "https://sdnmoweppzszpxyggdyg.supabase.co",
        env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseOptions,
      );

      // Configuración de zona horaria
      const nowUTC = new Date();
      const argentinaOffsetMs = 3 * 60 * 60 * 1000; // UTC-3

      // Calcular "Hoy" en Argentina
      const argentinaTime = new Date(nowUTC.getTime() - argentinaOffsetMs);
      const year = argentinaTime.getUTCFullYear();
      const month = argentinaTime.getUTCMonth();
      const day = argentinaTime.getUTCDate();
      const todayStr = argentinaTime.toISOString().split("T")[0];

      // NOTA: Construye la fecha en UTC usando los componentes ARG, y luego suma el offset
      // para obtener el instante UTC real equivalente al fin del dia de ARG.
      const startOfTodayArgentina = new Date(
        Date.UTC(year, month, day) + argentinaOffsetMs,
      );
      const endOfTodayArgentina = new Date(
        startOfTodayArgentina.getTime() + 24 * 60 * 60 * 1000,
      );

      const dayStartUTC = startOfTodayArgentina.toISOString();
      const dayEndUTC = endOfTodayArgentina.toISOString();

      // Calcular Ventana de Notificación (UTC puro)
      // Actividades que empiezan entre 2 y 3 horas desde "ahora"
      const windowStartMs = nowUTC.getTime() + 2 * 60 * 60 * 1000;
      const windowEndMs = nowUTC.getTime() + 3 * 60 * 60 * 1000;

      const windowStartTime = new Date(windowStartMs).toISOString();
      const windowEndTime = new Date(windowEndMs).toISOString();

      // Caso borde: Si son las 23:00 ARG, la ventana cae fuera del dia actual.
      const { data: singleDayActivities, error: error1 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt")
        .is("frequencyId", null)
        .eq("completed", false)
        // Que pertenezca al día de hoy
        .gte("startsAt", dayStartUTC)
        .lt("startsAt", dayEndUTC)
        // Que empiece dentro de las próximas 2-3 horas
        .gte("startsAt", windowStartTime)
        .lt("startsAt", windowEndTime);

      // Query 2: Get recurring activities that haven't ended and are valid for today
      const { data: recurringActivities, error: error2 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt, frequencyId")
        .not("frequencyId", "is", null)
        .eq("completed", false)
        .gte("startsAt", dayStartUTC)
        .lt("startsAt", dayEndUTC)
        .gte("startsAt", windowStartTime)
        .lt("startsAt", windowEndTime);

      // For linter
      if(error1 && error2){
        console.error(error1, error2);
      }

      // Filter recurring activities that don't have a completion for today
      const recurringToNotify: typeof recurringActivities = [];
      if (recurringActivities && recurringActivities.length > 0) {
        for (const activity of recurringActivities) {
          const { data: completions } = await supabase
            .from("activity_completions")
            .select("id")
            .eq("activityId", activity.id)
            .eq("completedDate", todayStr)
            .limit(1);

          // If no completion found for today, add to notification list
          if (!completions || completions.length === 0) {
            recurringToNotify.push(activity);
          }
        }
      }

      // Combine both lists
      const allActivitiesToNotify = [
        ...(singleDayActivities || []),
        ...recurringToNotify,
      ];

      if (allActivitiesToNotify.length === 0) {
        return;
      }

      // Send notifications for each activity
      const { NotificationsService } =
        await import("./modules/notifications/service.js");
      const notificationsService = new NotificationsService(supabase);

      // Array de Promises
      const notificationPromises = allActivitiesToNotify.map(
        async (activity) => {
          const targetUserId = activity.assignedTo;
          if (!targetUserId) return;

          return notificationsService.createNotification({
            userId: targetUserId,
            eventType: "activity_reminder",
            entityType: "activity",
            entityId: activity.id,
            title: "Actividad pendiente",
            body: `${activity.title}`,
          });
        },
      );

      // ctx.waitUntil para que Cloudflare no mate el proceso
      // y Promise.allSettled para que si una falla, las otras igual se ejecuten
      ctx.waitUntil(Promise.allSettled(notificationPromises));
    } catch (error) {
      console.error("Error in scheduled job:", error);
    }
  },
};
