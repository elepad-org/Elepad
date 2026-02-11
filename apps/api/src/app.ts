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
      const todayStr =
        argentinaTime.toISOString().split("T")[0] || "2000-01-01";

      // NOTA: Construye la fecha en UTC usando los componentes ARG, y luego suma el offset
      // para obtener el instante UTC real equivalente al fin del dia de ARG.
      const startOfTodayArgentina = new Date(
        Date.UTC(year, month, day) + argentinaOffsetMs,
      );
      const endOfTodayArgentina = new Date(
        startOfTodayArgentina.getTime() + 24 * 60 * 60 * 1000,
      );

      // Calcular Ventana de Notificación (UTC puro)
      // Actividades que empiezan entre 1 y 2 horas desde "ahora"
      const windowStartMs = nowUTC.getTime() + 1 * 60 * 60 * 1000;
      const windowEndMs = nowUTC.getTime() + 2 * 60 * 60 * 1000;

      const windowStartTime = new Date(windowStartMs).toISOString();

      // Si la ventana termina mañana, se corta en la medianoche de hoy
      const effectiveEndMs = Math.min(
        windowEndMs,
        endOfTodayArgentina.getTime(),
      );
      const effectiveEndTime = new Date(effectiveEndMs).toISOString();

      // Verificamos si la ventana es válida (por si son las 23:00hs y la ventana empieza mañana)
      if (windowStartMs >= endOfTodayArgentina.getTime()) {
        return; // O devuelve array vacío
      }

      const { data: singleDayActivities, error: error1 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt")
        .eq("completed", false)
        .eq("frequencyId", null)
        .gte("startsAt", windowStartTime)
        .lt("startsAt", effectiveEndTime);

      // Obtener actividades recurrentes con su frecuencia
      const { data: recurringActivities, error: error2 } = await supabase
        .from("activities")
        .select(
          `
          id, 
          title, 
          description, 
          assignedTo, 
          startsAt, 
          frequencyId,
          endsAt,
          frequencies!inner (
            id,
            rrule
          )
        `,
        )
        .eq("completed", false)
        .not("frequencyId", "is", null)
        .lte("startsAt", nowUTC.toISOString()); // No debe ser actividad futura

      if (error1 && error2) console.error(error1, error2);

      const { data: completedToday, error: completedError } = await supabase
        .from("activity_completions")
        .select("activityId")
        .eq("completedDate", todayStr);

      if (completedError) {
        console.error(completedError);
      }

      const completedActivityIdsToday = new Set(
        (completedToday || []).map((c) => c.activityId),
      );

      // Filtrar actividades recurrentes que corresponden para hoy y la ventana horaria
      const recurringToNotify = [];
      if (recurringActivities && recurringActivities.length > 0) {
        for (const activity of recurringActivities) {
          // Extraer la frecuencia
          const frequency = Array.isArray(activity.frequencies)
            ? activity.frequencies[0]
            : activity.frequencies;

          if (!frequency || !frequency.rrule) continue;

          // Verificar si la actividad corresponde al día de hoy según su rrule
          if (
            !isActivityValidForToday(
              activity.startsAt,
              activity.endsAt,
              frequency.rrule,
              todayStr,
            )
          ) {
            continue;
          }

          // Verificar si la hora de la actividad coincide con la ventana de notificación
          // La hora se obtiene de startsAt (que ya está en UTC) y se aplica a la fecha de hoy
          const activityStartDate = new Date(activity.startsAt);
          const activityHour = activityStartDate.getUTCHours();
          const activityMinute = activityStartDate.getUTCMinutes();

          // Crear una fecha de hoy (UTC) con la hora de la actividad
          const todayWithActivityTime = new Date(nowUTC);
          todayWithActivityTime.setUTCHours(activityHour, activityMinute, 0, 0);

          // Verificar si está dentro de la ventana de notificación
          const activityTimeMs = todayWithActivityTime.getTime();
          if (activityTimeMs < windowStartMs || activityTimeMs >= windowEndMs) {
            continue;
          }

          // Si no fue completada hoy, agregar a la lista
          if (!completedActivityIdsToday.has(activity.id)) {
            recurringToNotify.push(activity);
          }
        }
      }

      /**
       * Determina si una actividad recurrente corresponde al día de hoy según su rrule
       * Soporta los siguientes formatos de rrule:
       * - FREQ=YEARLY
       * - FREQ=MONTHLY
       * - FREQ=WEEKLY
       * - FREQ=WEEKLY;INTERVAL=2
       * - FREQ=DAILY
       * - FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR
       * - NULL (se maneja fuera de esta función)
       */
      function isActivityValidForToday(
        startsAt: string,
        endsAt: string | null,
        rrule: string,
        todayStr: string,
      ): boolean {
        const activityStart = new Date(startsAt);
        const activityEnd = endsAt ? new Date(endsAt) : null;

        // Convertir la fecha de hoy (Argentina) a un objeto Date al inicio del día en UTC
        const today = new Date(todayStr + "T00:00:00.000Z");

        // Si la actividad ya terminó, no es válida
        if (activityEnd && activityEnd < today) {
          return false;
        }

        // Parsear la rrule
        const freqMatch = rrule.match(/FREQ=(\w+)/);
        const freq = freqMatch ? freqMatch[1] : null;

        const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1] || "1") : 1;

        const byDayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
        const byDay = byDayMatch
          ? byDayMatch[1]
            ? byDayMatch[1].split(",")
            : []
          : [];

        if (!freq) return false;

        // Convertir ambas fechas a Argentina para comparar días
        const activityStartArgentina = new Date(
          activityStart.getTime() - argentinaOffsetMs,
        );
        const todayArgentina = new Date(today.getTime() - argentinaOffsetMs);
        const startMonth = activityStartArgentina.getUTCMonth();
        const startYear = activityStartArgentina.getUTCFullYear();
        const todayMonth = todayArgentina.getUTCMonth();
        const todayYear = todayArgentina.getUTCFullYear();

        // Normalizar fechas al inicio del día para comparación
        const startOfActivityDay = new Date(activityStartArgentina);
        startOfActivityDay.setUTCHours(0, 0, 0, 0);

        const startOfToday = new Date(todayArgentina);
        startOfToday.setUTCHours(0, 0, 0, 0);

        // Calcular diferencia en días
        const daysDiff = Math.floor(
          (startOfToday.getTime() - startOfActivityDay.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysDiff < 0) return false; // La actividad aún no ha comenzado

        switch (freq) {
          case "DAILY":
            // Si hay BYDAY, verificar que hoy sea uno de esos días
            if (byDay.length > 0) {
              const dayOfWeek = todayArgentina.getUTCDay();
              const dayMap: Record<number, string> = {
                0: "SU",
                1: "MO",
                2: "TU",
                3: "WE",
                4: "TH",
                5: "FR",
                6: "SA",
              };

              return byDay.includes(dayMap[dayOfWeek] ? dayMap[dayOfWeek] : "");
            }
            // Sin BYDAY, es todos los días según el intervalo
            return daysDiff % interval === 0;

          case "WEEKLY":
            // Verificar que sea el mismo día de la semana que el día de inicio
            const activityDayOfWeek = activityStartArgentina.getUTCDay();
            const todayDayOfWeek = todayArgentina.getUTCDay();

            if (activityDayOfWeek !== todayDayOfWeek) {
              return false;
            }

            // Verificar el intervalo de semanas
            const weeksDiff = Math.floor(daysDiff / 7);
            return weeksDiff % interval === 0;

          case "MONTHLY":
            const monthsDiff =
              (todayYear - startYear) * 12 + (todayMonth - startMonth);

            // Verificar que sea el mismo día del mes y que el intervalo de meses sea correcto
            return (
              monthsDiff >= 0 &&
              monthsDiff % interval === 0 &&
              activityStartArgentina.getUTCDate() ===
                todayArgentina.getUTCDate()
            );

          case "YEARLY":
            const yearsDiff = todayYear - startYear;
            // Verificar que sea el mismo día y mes del año y que el intervalo de años sea correcto
            return (
              yearsDiff >= 0 &&
              yearsDiff % interval === 0 &&
              activityStartArgentina.getUTCMonth() === todayMonth &&
              activityStartArgentina.getUTCDate() ===
                todayArgentina.getUTCDate()
            );

          default:
            return false;
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
