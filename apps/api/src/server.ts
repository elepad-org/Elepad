import { serve } from "@hono/node-server";
import app from "./app.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import https from "https";

// Generate OpenAPI spec on server startup.
import "./emit-openapi.js";

// Read environment variables from a .env file.
// This works on NodeJS because the API runs as a server, so the `process` object is available.
dotenv.config();
const {
  PORT = "8787",
  SUPABASE_URL = "https://sdnmoweppzszpxyggdyg.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

// Configurar fetch personalizado para evitar problemas con SSL en desarrollo
const customFetch: typeof fetch = (url, options) => {
  const isHttps = typeof url === "string" && url.startsWith("https");

  if (isHttps && process.env.NODE_ENV === "development") {
    // Crear agente HTTPS que ignore errores de certificado en desarrollo
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    return fetch(url, {
      ...options,
      // @ts-ignore
      agent,
    });
  }

  return fetch(url, options);
};

// Run the Hono API as a NodeJS server.
const server = serve({ fetch: app.fetch, port: Number(PORT) }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`);
  console.log(`📜 Swagger UI at http://localhost:${info.port}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: customFetch,
    },
  });

  // Ping simple a Supabase usando Storage para comprobar la conexión.
  supabase.storage
    .listBuckets()
    .then(({ error }) => {
      if (error) {
        console.warn("⚠️ Error en el ping a Supabase", error.message);
      } else {
        console.log("👍 Ping a Supabase exitoso");
      }
    })
    .catch((err) => {
      console.warn("⚠️ Error en el ping a Supabase", err);
    });
});

// Graceful shutdown.
process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
