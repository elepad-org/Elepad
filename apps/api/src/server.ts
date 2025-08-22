import { serve } from "@hono/node-server";
import app from "./app.js";
import { config, createSupabaseClient } from "./config.js";

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}/api`);
  console.log(`📜 Swagger UI at http://localhost:${info.port}/api`);

  // Ping simple a Supabase usando Storage para comprobar la conexión
  const supabase = createSupabaseClient();
  supabase.storage
    .listBuckets()
    .then(({ error }) => {
      if (error) {
        console.warn(`⚠️ Error de conexión a la DB: ${error.message}`);
      } else {
        console.log("✅ Conexión a la DB: exitosa");
      }
    })
    .catch((err) => {
      console.warn("⚠️ Error verificando la DB/Supabase", err);
    });
});

// graceful shutdown
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
