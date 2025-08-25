import { OpenAPIHono, z } from "@hono/zod-openapi";
import { UserSchema } from "./schema";
import { UserService } from "./service";

export const usersApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    userService: UserService;
  }
}

// Add a UserService instance to each request context in this usersApp
usersApp.use("*", async (c, next) => {
  const userService = new UserService(c.var.supabase);
  c.set("userService", userService);
  await next();
});

usersApp.openapi(
  {
    method: "get",
    path: "/users/{id}",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        description: "User",
        content: { "application/json": { schema: UserSchema } },
      },
      404: { description: "Not found" },
    },
    tags: ["users"],
    operationId: "getUser",
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await c.var.userService.getUser(id);
    // TODO: return JSON error (using a helper function) instead of a null body
    return user ? c.json(user) : c.body(null, 404);
  },
);
