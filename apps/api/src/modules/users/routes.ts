import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { usersService } from "./service";
import { withHeaders } from "@/middleware/headers";
import { User } from "./schema";

const app = new OpenAPIHono();

app.use("*", withHeaders);

const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "User",
      content: { "application/json": { schema: User } },
    },
    404: { description: "Not found" },
  },
  tags: ["users"],
  operationId: "getUser",
});

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = await usersService.getById(id);
  return user ? c.json(user) : c.body(null, 404);
});

export const usersApp = app;
