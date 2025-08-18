import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateUserInput, User } from "./schema";
import { usersService } from "./service";
import { withHeaders } from "@/middleware/headers";

const app = new OpenAPIHono();

app.use("*", withHeaders);

const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  request: {
    body: { content: { "application/json": { schema: CreateUserInput } } },
  },
  responses: {
    201: {
      description: "Created",
      content: { "application/json": { schema: User } },
    },
    400: { description: "Not found" },
  },
  tags: ["users"],
  operationId: "createUser",
});

app.openapi(createUserRoute, async (c) => {
  const input = c.req.valid("json");
  const user = await usersService.create(input);
  return user ? c.json(user, 201) : c.body(null, 400);
});

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
