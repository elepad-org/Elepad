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
   * Runs every 3 hours
   */
  async scheduled(
    event: ScheduledEvent,
    env: {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    },
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log("Running scheduled job for pending activities notifications");

    try {
      const supabaseOptions = customFetch
        ? { global: { fetch: customFetch } }
        : undefined;

      const supabase = createClient(
        env.SUPABASE_URL || "https://sdnmoweppzszpxyggdyg.supabase.co",
        env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseOptions,
      );

      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Query 1: Get single-day activities (no frequency) for today
      const { data: singleDayActivities, error: error1 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt")
        .is("frequencyId", null)
        .gte("startsAt", todayStr)
        .lt("startsAt", `${todayStr}T23:59:59.999Z`);

      if (error1) {
        console.error("Error fetching single-day activities:", error1);
      }

      // Query 2: Get recurring activities that haven't ended and are not completed today
      const { data: recurringActivities, error: error2 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt, frequencyId")
        .not("frequencyId", "is", null)
        .or(`endsAt.is.null,endsAt.gte.${todayStr}`);

      if (error2) {
        console.error("Error fetching recurring activities:", error2);
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
        console.log("No hay actividades para notificar.");
        return;
      }

      console.log(`Found ${allActivitiesToNotify.length} pending activities for today`);

      // Send notifications for each activity
      const { NotificationsService } = await import("./modules/notifications/service.js");
      const notificationsService = new NotificationsService(supabase);

      // Array de Promises
      const notificationPromises = allActivitiesToNotify.map(async (activity) => {
        const targetUserId = activity.assignedTo;
        if (!targetUserId) return;

        return notificationsService.createNotification({
          userId: targetUserId,
          eventType: "activity_reminder",
          entityType: "activity",
          entityId: activity.id,
          title: "Actividad pendiente",
          body: `Tienes una actividad pendiente: ${activity.title}`,
        });
      });

      // ctx.waitUntil para que Cloudflare no mate el proceso
      // y Promise.allSettled para que si una falla, las otras igual se ejecuten
      ctx.waitUntil(
        Promise.allSettled(notificationPromises).then((results) => {
          const successful = results.filter((r) => r.status === "fulfilled").length;
          const failed = results.filter((r) => r.status === "rejected").length;
          console.log(`Proceso terminado: ${successful} enviadas, ${failed} fallidas.`);
        })
      );

      console.log("Scheduled job completed successfully");
    } catch (error) {
      console.error("Error in scheduled job:", error);
    }
  },
};
