import { OpenAPIHono, z } from "@hono/zod-openapi";
import { FrequencyService } from "./service";
import { FrequencySchema, NewFrequencySchema } from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const frequenciesApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    frequencyService: FrequencyService;
  }
}

frequenciesApp.use("*", async (c, next) => {
  const frequencyService = new FrequencyService(c.var.supabase);
  c.set("frequencyService", frequencyService);
  await next();
});

frequenciesApp.openapi(
  {
    method: "get",
    path: "/frequencies",
    tags: ["frequencies"],
    responses: {
      200: {
        description: "Lista de frecuencias disponibles",
        content: { "application/json": { schema: z.array(FrequencySchema) } },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const frequencies = await c.var.frequencyService.getAll();
    return c.json(frequencies, 200);
  },
);

frequenciesApp.openapi(
  {
    method: "get",
    path: "/frequencies/{id}",
    tags: ["frequencies"],
    request: { params: z.object({ id: z.uuid() }) },
    responses: {
      200: {
        description: "Frecuencia",
        content: { "application/json": { schema: FrequencySchema } },
      },
      404: openApiErrorResponse("Frecuencia no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const frequency = await c.var.frequencyService.getById(id);
    return c.json(frequency, 200);
  },
);

frequenciesApp.openapi(
  {
    method: "post",
    path: "/frequencies",
    tags: ["frequencies"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewFrequencySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Frecuencia creada",
        content: { "application/json": { schema: FrequencySchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const frequency = await c.var.frequencyService.create(body);
    return c.json(frequency, 201);
  },
);
