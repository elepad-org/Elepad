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

  // First validate the token and get user
  const {
    data: { user },
    error: userError,
  } = await c.var.supabase.auth.getUser(token);

  if (userError || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Now try to get the current session (which may have provider tokens)
  const {
    data: { session },
    error: sessionError,
  } = await c.var.supabase.auth.getSession();

  // Set user and session in context
  c.set("user", user);

  if (sessionError || !session) {
    c.set("session", null);
  } else {
    // Only use the session if it belongs to the same user
    if (session.user.id === user.id) {
      c.set("session", session);
    } else {
      c.set("session", null);
    }
  }

  await next();
};
