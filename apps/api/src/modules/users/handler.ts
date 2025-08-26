import { OpenAPIHono, z } from "@hono/zod-openapi";
import { UpdateUserSchema, UserSchema } from "./schema";
import { UserService } from "./service";
import { ApiException } from "@/utils/api-error";

export const usersApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    userService: UserService;
  }
}

// Add a UserService instance to each request context
usersApp.use("*", async (c, next) => {
  const userService = new UserService(c.var.supabase);
  c.set("userService", userService);
  await next();
});

usersApp.openapi(
  {
    method: "get",
    path: "/users/{id}",
    tags: ["users"],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        description: "User",
        content: { "application/json": { schema: UserSchema } },
      },
      404: { description: "Not found" },
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await c.var.userService.getUserById(id);
    // TODO: return JSON error (using a helper function) instead of a null body
    return user ? c.json(user) : c.body(null, 404);
  },
);

usersApp.openapi(
  {
    method: "patch",
    path: "/users/{id}",
    tags: ["users"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateUserSchema, // e.g. { displayName?: string; ... }
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Updated user",
        content: { "application/json": { schema: UserSchema } },
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
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json"); // Zod validated JSON
    const updated = await c.var.userService.update(id, body);
    if (!updated) throw new ApiException(404, "User not found");
    return c.json(updated, 200);
  },
);

usersApp.openapi(
  {
    method: "patch",
    path: "/users/{id}/avatar",
    tags: ["users"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              avatarFile: z.any().openapi({ type: "string", format: "binary" }),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Updated user (avatar replaced)",
        content: { "application/json": { schema: UserSchema } },
      },
      400: {
        description: "Invalid form data",
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
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const contentType = c.req.header("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      throw new ApiException(400, "Content-Type must be multipart/form-data");
    }

    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      throw new ApiException(400, "Invalid form data");
    }

    // optional: validate text parts against AvatarFormSchema sans file coercion
    const updated = await c.var.userService.updateUserAvatar(id, form);
    if (!updated) throw new ApiException(404, "User not found");
    return c.json(updated, 200);
  },
);

usersApp.openapi(
  {
    method: "patch",
    path: "/users/{id}",
    tags: ["users"],
    request: {
      params: z.object({ id: z.uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateUserSchema,
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
        content: { "application/json": { schema: UserSchema } },
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
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const contentType = c.req.header("content-type") ?? "";
    let updated;

    if (contentType.includes("multipart/form-data")) {
      // Request has form data, which means a file upload for the avatar image.
      let form: FormData;
      try {
        form = await c.req.formData();
      } catch {
        throw new ApiException(400, "Invalid form data");
      }

      updated = await c.var.userService.updateUserAvatar(id, form);
    } else {
      // Request does not have form data, so it's a regular JSON update.
      const body = c.req.valid("json");
      updated = await c.var.userService.update(id, body);
    }

    if (!updated) {
      throw new ApiException(404, "User not found");
    }

    return c.json(updated, 200);
  },
);
