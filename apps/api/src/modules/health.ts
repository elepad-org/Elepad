import { OpenAPIHono, z } from "@hono/zod-openapi";

const HealthSchema = z
  .object({
    ok: z.boolean(),
    timestamp: z.string(),
  })
  .openapi("Health");

export const healthApp = new OpenAPIHono().openapi(
  {
    method: "get",
    path: "/health",
    tags: ["health"],
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
  },
  async (c) => {
    const { error } = await c.var.supabase.storage.listBuckets();
    return c.json(
      {
        ok: !error,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  },
);
