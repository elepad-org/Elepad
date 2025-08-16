import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { CreateUserInput, User, } from "./schema";
import { usersService } from "./service";
//import { withAuth } from "../../middleware/auth";

export const usersApp = new OpenAPIHono()
  //.use("*", withAuth) // if users endpoints require auth
  .openapi(
    createRoute({
      method: "post",
      path: "/create",
      request: { body: { content: { "application/json": { schema: CreateUserInput } } } },
      responses: { 201: { description: "Created", content: { "application/json": { schema: User } } }, 400: { description: "Not found" } },
      tags: ["users"],
      operationId: "createUser",
    }),
    async (c) => {
      const input = c.req.valid("json");
      
      const user = await usersService.create(input);
      return user ? c.json(user, 201) : c.body(null, 400);
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      request: { params: z.object({ id: z.string() }) },
      responses: { 200: { description: "User", content: { "application/json": { schema: User } } }, 404: { description: "Not found" } },
      tags: ["users"],
      operationId: "getUser",
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const user = await usersService.getById(id);
      return user ? c.json(user) : c.body(null, 404);
    },
  )

