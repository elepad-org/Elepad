import { serve } from "@hono/node-server";
import app from "./app.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

/**
 * Write the OpenAPI spec to a file.
 * This is useful for local development, so the api-client package is regenerated on every change.
 * This is needed in CI pipelines, since there is no server to serve the JSON from.
 */
export function emitOpenApiSchema() {
  const spec = app.getOpenAPIDocument({
    openapi: "3.1.0",
    info: { title: "Elepad API", version: "1.0.0" },
  });

  const outputPath = path.resolve(process.cwd(), "openapi.json");

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

  console.log(`✅ OpenAPI schema generated at ${outputPath}`);
}

// Run the Hono API as a NodeJS server.
const server = serve({ fetch: app.fetch, port: Number(PORT) }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`);
  console.log(`📜 Swagger UI at http://localhost:${info.port}`);
  emitOpenApiSchema();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Ping simple a Supabase usando Storage para comprobar la conexión.
  supabase.storage
    .listBuckets()
    .then(({ error }) => {
      if (error) {
        console.warn("⚠️ Error en el ping a Supabase", error.message);
      } else {
        console.log("✅ Ping a Supabase exitoso");
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
