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
import { frequenciesApp } from "./modules/frequencies/handler.js";
import { activityCompletionsHandler } from "./modules/activityCompletions/handler.js";
import { puzzlesApp } from "./modules/puzzles/handler.js";
import { attemptsApp } from "./modules/attempts/handler.js";
import { achievementsApp } from "./modules/achievements/handler.js";
import { streaksApp } from "./modules/streaks/handler.js";
import { withAuth } from "./middleware/auth.js";

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

const app = new OpenAPIHono();

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

// OpenAPI spec.
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
  tags: [
    { name: "users" },
    { name: "memories" },
    { name: "familyGroups" },
    { name: "frequencies" },
    { name: "ActivityCompletions" },
    { name: "games" },
    { name: "puzzles" },
    { name: "attempts" },
    { name: "achievements" },
    { name: "streaks" },
  ],
});

// Serve OpenAPI documentation with SwaggerUI.
app.get("/", swaggerUI({ url: "./openapi.json" }));

export default app;
