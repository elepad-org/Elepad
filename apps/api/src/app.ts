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
import { calendarApp } from "./modules/calendar/handler.js";
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

app.use("/calendar/generate", withAuth);
app.route("/", calendarApp);

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
    { name: "calendar" },
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
      const todayStr =
        argentinaTime.toISOString().split("T")[0] || "2000-01-01";

      // Calcular Ventana de Notificación (UTC puro)
      // Actividades que empiezan entre 1 y 2 horas desde "ahora"
      const windowStartMs = nowUTC.getTime() + 1 * 60 * 60 * 1000;
      const windowEndMs = nowUTC.getTime() + 2 * 60 * 60 * 1000;

      const windowStartTime = new Date(windowStartMs).toISOString();

      const effectiveEndTime = new Date(windowEndMs).toISOString();

      const { data: singleDayActivities, error: error1 } = await supabase
        .from("activities")
        .select("id, title, description, assignedTo, startsAt")
        .eq("completed", false)
        .is("frequencyId", null)
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
        .lte("startsAt", effectiveEndTime); // No debe ser actividad futura

      if (error1 && error2) {
        console.log("Error en scheduled:", error1, error2);
        return;
      }

      const { data: completedToday, error: completedError } = await supabase
        .from("activity_completions")
        .select("activityId")
        .eq("completedDate", todayStr);

      if (completedError) {
        console.log(completedError);
      }

      const currentToNotify = [];
      if (singleDayActivities && singleDayActivities.length > 0) {
        for (const activity of singleDayActivities) {
          currentToNotify.push(activity);
        }
      }

      const completedActivityIdsToday = new Set(
        (completedToday || []).map((c) => c.activityId),
      );

      // Filtrar actividades recurrentes que corresponden para hoy y la ventana horaria
      const recurringToNotify = [];
      if (recurringActivities && recurringActivities.length > 0) {
        const [tYear, tMonth, tDay] = todayStr.split("-").map(Number);
        if (tYear && tMonth && tDay) {
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
                tYear,
                tMonth,
                tDay,
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
            todayWithActivityTime.setUTCHours(
              activityHour,
              activityMinute,
              0,
              0,
            );

            // Verificar si está dentro de la ventana de notificación
            const activityTimeMs = todayWithActivityTime.getTime();
            if (
              activityTimeMs < windowStartMs ||
              activityTimeMs >= windowEndMs
            ) {
              continue;
            }

            // Si no fue completada hoy, agregar a la lista
            if (!completedActivityIdsToday.has(activity.id)) {
              recurringToNotify.push(
                activity.id,
                activity.title,
                activity.description,
                activity.assignedTo,
                activity.startsAt,
              );
            }
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
        tYear: number,
        tMonth: number,
        tDay: number,
      ): boolean {
        // Parsear la fecha "Hoy" (Argentina) directamente a componentes locales
        const todayAnchor = new Date(Date.UTC(tYear, tMonth - 1, tDay));

        // Parsear fecha de inicio (UTC) y ajustarla a Argentina
        const startDateUTC = new Date(startsAt);
        const argentinaOffsetMs = 3 * 60 * 60 * 1000;
        const startDateArgentina = new Date(
          startDateUTC.getTime() - argentinaOffsetMs,
        );

        // Normalizar inicio al comienzo del día (00:00) para calcular diferencias de días limpias
        const startAnchor = new Date(
          Date.UTC(
            startDateArgentina.getUTCFullYear(),
            startDateArgentina.getUTCMonth(),
            startDateArgentina.getUTCDate(),
          ),
        );

        if (todayAnchor.getTime() < startAnchor.getTime()) return false;

        // Validación de fin: Si la actividad ya terminó (y endsAt está definido)
        if (endsAt) {
          const endDateUTC = new Date(endsAt);
          const endDateArgentina = new Date(
            endDateUTC.getTime() - argentinaOffsetMs,
          );
          // Aquí asumimos: si terminó AYER, hoy ya no es válida.
          const endAnchor = new Date(
            Date.UTC(
              endDateArgentina.getUTCFullYear(),
              endDateArgentina.getUTCMonth(),
              endDateArgentina.getUTCDate(),
            ),
          );
          if (todayAnchor.getTime() > endAnchor.getTime()) return false;
        }

        // Parsear RRULE
        const freqMatch = rrule.match(/FREQ=(\w+)/);
        const freq = freqMatch ? freqMatch[1] : null;
        if (!freq) return false;

        const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1] ? intervalMatch[1] : "1") : 1;

        const byDayMatch = rrule.match(/BYDAY=([A-Z,]+)/);

        const byDays = byDayMatch && byDayMatch[1] ? byDayMatch[1].split(",") : [];

        // Calcular diferencia exacta en días
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysDiff = Math.floor(
          (todayAnchor.getTime() - startAnchor.getTime()) / msPerDay,
        );

        // 4. Lógica por Frecuencia
        switch (freq) {
          case "DAILY":
            // Si hay BYDAY (ej: Lunes y Miercoles), ignoramos el intervalo de días simples
            // y chequeamos si hoy es uno de esos días.
            if (byDays.length > 0) {
              return (
                isDayInByDay(todayAnchor, byDays) &&
                checkDailyInterval()
              );
              // Nota: RRULE complejo combina intervalo y byday, pero usualmente DAILY + BYDAY implica
              // "cada X días, pero solo si es Lunes". Simplifiquemos a check de día.
            }
            return daysDiff % interval === 0;

          case "WEEKLY":
            // Calcular en qué "número de semana" estamos desde el inicio
            const weekIndex = Math.floor(daysDiff / 7);

            // 1. Chequear intervalo de semanas (cada 2 semanas, etc)
            if (weekIndex % interval !== 0) return false;

            // 2. Chequear día específico
            if (byDays.length > 0) {
              // Si hay BYDAY explícito (ej: MO,WE), hoy debe ser uno de esos
              return isDayInByDay(todayAnchor, byDays);
            } else {
              // Si NO hay BYDAY, debe ser el mismo día de la semana que el inicio
              return todayAnchor.getUTCDay() === startAnchor.getUTCDay();
            }

          case "MONTHLY":
            // Calculamos diferencia de meses
            const monthsDiff =
              (tYear - startAnchor.getUTCFullYear()) * 12 +
              (tMonth - 1 - startAnchor.getUTCMonth());

            if (monthsDiff < 0) return false;
            if (monthsDiff % interval !== 0) return false;

            // Verificar el día del mes (Ej: el 15 de cada mes)
            // Nota: Esto no maneja "el tercer martes del mes", solo "el día X"
            return tDay === startAnchor.getUTCDate();

          case "YEARLY":
            const yearsDiff = tYear - startAnchor.getUTCFullYear();
            if (yearsDiff < 0) return false;
            if (yearsDiff % interval !== 0) return false;

            // Mismo día y mismo mes
            return (
              tMonth - 1 === startAnchor.getUTCMonth() &&
              tDay === startAnchor.getUTCDate()
            );

          default:
            return false;
        }
      }

      // Helper para verificar días de la semana (SU, MO, TU...)
      function isDayInByDay(date: Date, byDays: string[]): boolean {
        const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const dayCode = dayMap[date.getUTCDay()] || "";
        return byDays.includes(dayCode);
      }

      // Helper opcional para daily si quieres ser estricto
      function checkDailyInterval(): boolean {
        return true; // En DAILY simple con BYDAY, el intervalo suele ser 1.
      }

      if (currentToNotify.length === 0 && recurringToNotify.length === 0) {
        console.log("No actividades a notificar");
        return;
      }

      // Combine both lists
      const allActivitiesToNotify = [...currentToNotify, ...recurringToNotify];

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
      console.log("Error in scheduled job:", error);
    }
  },
};
