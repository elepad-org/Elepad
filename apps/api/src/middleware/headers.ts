import type { MiddlewareHandler } from "hono";

/**
 * This middleware sets common security headers.
 * TODO: find out how useful is this, if at all.
 */
export const withHeaders: MiddlewareHandler = async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-XSS-Protection", "0");

  await next();
};
