import type { MiddlewareHandler } from "hono";

/**
 * This middleware checks for a valid Bearer token in the Authorization header.
 * If Supabase validates the token, the user information is attached to the context (in the `user` variable).
 * If not, a 401 Unauthorized status is returned.
 */
export const withAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Discard the 'Bearer ' prefix.
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await c.var.supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);

  await next();
};
