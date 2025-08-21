import { OpenAPIHono, z } from "@hono/zod-openapi";
import { createSupabaseClient } from "@/config";

const HealthSchema = z.object({
  ok: z.boolean(),
  uptime: z.number(),
  ts: z.string(),
  dbOk: z.boolean().optional(),
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
  async (c) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.storage.listBuckets();
    const dbOk = !error;
    return c.json(
      {
        ok: true,
        uptime: process.uptime(),
        ts: new Date().toISOString(),
        dbOk,
      },
      200
    );
  }
);
