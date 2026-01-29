import { OpenAPIHono, z } from "@hono/zod-openapi";
import { PushTokensService } from "./service";
import { upsertPushTokenSchema, removePushTokenSchema } from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const pushTokensApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    pushTokensService: PushTokensService;
  }
}

// Middleware para inyectar el PushTokensService en cada request
pushTokensApp.use("/devices/*", async (c, next) => {
  const pushTokensService = new PushTokensService(c.var.supabase);
  c.set("pushTokensService", pushTokensService);
  await next();
});

// POST /devices/register - Register a device token
pushTokensApp.openapi(
  {
    method: "post",
    path: "/devices/register",
    tags: ["devices"],
    summary: "Register a device for push notifications",
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertPushTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
      400: openApiErrorResponse("Validation error"),
      ...openApiErrorResponse,
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    await c.var.pushTokensService.upsertPushToken({
      userId,
      token: body.expo_push_token,
      platform: body.platform,
      deviceId: body.device_id,
    });

    return c.json({ success: true }, 200);
  }
);

// DELETE /push-tokens - Remove a push token
pushTokensApp.openapi(
  {
    method: "delete",
    path: "/push-tokens",
    tags: ["push-tokens"],
    summary: "Remove a push token",
    request: {
      body: {
        content: {
          "application/json": {
            schema: removePushTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
      400: openApiErrorResponse("Validation error"),
      ...openApiErrorResponse,
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    await c.var.pushTokensService.removePushToken(userId, body.token);

    return c.json({ success: true }, 200);
  }
);