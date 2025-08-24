import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { usersService } from "./service";
import { withHeaders } from "@/middleware/headers";
import { UpdateUserInput, User } from "./schema";

const app = new OpenAPIHono();

app.use("*", withHeaders);

const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: "User",
      content: { "application/json": { schema: User } },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
  },
  tags: ["users"],
  operationId: "getUser",
});

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = await usersService.getById(id);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user, 200);
});

const updateUserRoute = createRoute({
  method: "patch",
  path: "/users/{id}",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: UpdateUserInput,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated user",
      content: { "application/json": { schema: User } },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
  },
  tags: ["users"],
  operationId: "updateUser",
});

app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  try {
    const updated = await usersService.update(id, body);
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json(updated, 200);
  } catch {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export const usersApp = app;
