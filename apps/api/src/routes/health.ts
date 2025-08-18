import { OpenAPIHono, z } from "@hono/zod-openapi";

const HealthSchema = z.object({
  ok: z.boolean(),
  uptime: z.number(),
  ts: z.string(),
});

export const healthApp = new OpenAPIHono().openapi(
  {
    method: "get",
    path: "/health",
    responses: {
      200: {
        description: "Health check",
        content: {
          "application/json": {
            schema: HealthSchema,
          },
        },
      },
    },
    tags: ["Health"],
  },
  (c) =>
    c.json(
      {
        ok: true,
        uptime: process.uptime(),
        ts: new Date().toISOString(),
      },
      200,
    ),
);
