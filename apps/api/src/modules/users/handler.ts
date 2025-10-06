import { OpenAPIHono, z } from "@hono/zod-openapi";
import { UpdateUserSchema, UserSchema } from "./schema";
import { UserService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";

export const usersApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    userService: UserService;
  }
}

// Add a UserService instance to each request context.
usersApp.use("/users/*", async (c, next) => {
  const userService = new UserService(c.var.supabase);
  c.set("userService", userService);
  await next();
});

usersApp.openapi(
  {
    method: "get",
    path: "/users/{id}",
    tags: ["users"],
    request: { params: z.object({ id: z.uuid() }) },
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
    return c.json(user);
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
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Updated user",
        content: { "application/json": { schema: UserSchema } },
      },
      400: openApiErrorResponse("Invalid request"),
      404: openApiErrorResponse("User not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const updated = await c.var.userService.update(id, body);
    if (!updated) {
      throw new ApiException(404, "User not found");
    }

    return c.json(updated, 200);
  },
);

usersApp.openapi(
  {
    method: "patch",
    path: "/users/{id}/avatar",
    tags: ["users"],
    request: {
      params: z.object({ id: z.uuid() }),
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
      400: openApiErrorResponse("Invalid form data"),
      404: openApiErrorResponse("User not found"),
      500: openApiErrorResponse("Internal Server Error"),
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

    const updated = await c.var.userService.updateUserAvatar(id, form);
    if (!updated) throw new ApiException(404, "User not found");
    return c.json(updated, 200);
  },
);
