import type { MiddlewareHandler } from "hono";

/**
 * This middleware catches any unhandled errors in the request processing pipeline.
 * It logs the error and responds with a 500 Internal Server Error status.
 */
export const withErrors: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
