import type { MiddlewareHandler } from "hono";

/**
 * This middleware sets common security and CORS headers.
 * It also handles preflight OPTIONS requests.
 */
export const withHeaders: MiddlewareHandler = async (c, next) => {
  // CORS (simple default)
  // TODO: find out if it should be tighter for prod
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // Security headers
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-XSS-Protection", "0");

  if (c.req.method === "OPTIONS") return c.body(null, 204);

  await next();
};
