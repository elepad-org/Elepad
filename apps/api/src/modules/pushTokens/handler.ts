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
pushTokensApp.use("/push-tokens/*", async (c, next) => {
  const pushTokensService = new PushTokensService(c.var.supabase);
  c.set("pushTokensService", pushTokensService);
  await next();
});

// POST /push-tokens - Upsert a push token
pushTokensApp.openapi(
  {
    method: "post",
    path: "/push-tokens",
    tags: ["push-tokens"],
    summary: "Store or update a push token",
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
      ...openApiErrorResponse,
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    await c.var.pushTokensService.upsertPushToken({
      userId,
      token: body.token,
      platform: body.platform,
      deviceId: body.deviceId,
    });

    return c.json({ success: true });
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
      ...openApiErrorResponse,
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const body = c.req.valid("json");

    await c.var.pushTokensService.removePushToken(userId, body.token);

    return c.json({ success: true });
  }
);