import { serve } from "@hono/node-server";
import app from "./app.js";
import { config } from "./config.js";

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`);
  console.log(`📜 Swagger UI at http://localhost:${info.port}`);
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
