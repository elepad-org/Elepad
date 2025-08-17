import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { withSecurity } from "./middleware/security.js";
import { withErrors } from "./middleware/errors.js";
import { healthApp } from "./routes/health.js";
import { usersApp } from "./modules/users";

const app = new OpenAPIHono();

// global middleware
app.use("*", withErrors);
app.use("*", withSecurity);

// OpenAPI document + Swagger UI
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Elepad API", version: "1.0.0" },
  tags: [{ name: "users" }],
});

// mount routes
app.route("/", healthApp);
app.route("/", usersApp);

// Swagger UI
app.get("/", swaggerUI({ url: "/openapi.json" }));

export default app;
