import { OpenAPIHono } from "@hono/zod-openapi";
import { withHeaders } from "./middleware/headers.js";
import { healthApp } from "./modules/health.js";
import { usersApp } from "./modules/users/handler.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";

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
    supabase: SupabaseClient;
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  c.set("supabase", supabase);
  await next();
});

// Mount routes.
app.route("/", healthApp);
app.route("/", usersApp);

// OpenAPI spec.
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
  tags: [{ name: "users" }],
});

// Serve OpenAPI documentation with Redoc, a better alternative to SwaggerUI.
app.get("/", (c) => {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>API Docs</title>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,700"/>
    </head>
    <body>
      <redoc spec-url="./openapi.json"></redoc>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js" crossorigin></script>
    </body>
  </html>
  `;
  return c.html(html);
});

export default app;
