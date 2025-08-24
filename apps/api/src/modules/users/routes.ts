import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { usersService } from "./service";
import { withHeaders } from "@/middleware/headers";
import { UpdateUserInput, User } from "./schema";
// La subida de archivos se delega al servicio

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
        "multipart/form-data": {
          // Permitimos cualquier tipo para que Zod no rechace el File
          schema: z
            .object({
              displayName: z.string().min(1).optional(),
              avatarFile: z
                .any()
                .optional()
                .openapi({ type: "string", format: "binary" }),
            })
            .partial(),
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
  const contentType = c.req.header("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await c.req.formData();
      const updated = await usersService.updateWithFile(id, form);
      if (!updated) return c.json({ error: "User not found" }, 404);
      return c.json(updated, 200);
    }

    // JSON por defecto
    const body = c.req.valid("json");
    const updated = await usersService.update(id, body);
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json(updated, 200);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export const usersApp = app;
