import { OpenAPIHono, z } from "@hono/zod-openapi";
import { ActivityService } from "./service";
import {
  ActivitySchema,
  NewActivitySchema,
  UpdateActivitySchema,
} from "./schema";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";

export const activitiesApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    activityService: ActivityService;
  }
}

activitiesApp.use("*", async (c, next) => {
  const activityService = new ActivityService(c.var.supabase);
  c.set("activityService", activityService);
  await next();
});

activitiesApp.openapi(
  {
    method: "get",
    path: "/activities/{id}",
    tags: ["activities"],
    request: { params: z.object({ id: z.uuid() }) },
    responses: {
      200: {
        description: "Actividad",
        content: { "application/json": { schema: ActivitySchema } },
      },
      404: openApiErrorResponse("Actividad no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const event = await c.var.activityService.getById(id);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "get",
    path: "/activities/user/{idCreator}",
    tags: ["activities"],
    request: { params: z.object({ idCreator: z.uuid() }) },
    responses: {
      200: {
        description: "Actividad",
        content: { "application/json": { schema: z.array(ActivitySchema) } },
      },
      404: openApiErrorResponse("Actividad no encontrada"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { idCreator } = c.req.valid("param");
    const event = await c.var.activityService.getByUserId(idCreator);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "post",
    path: "/activities",
    tags: ["activities"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewActivitySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Actividad creado",
        content: { "application/json": { schema: ActivitySchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const event = await c.var.activityService.create(body);
    return c.json(event, 201);
  },
);

activitiesApp.openapi(
  {
    method: "patch",
    path: "/activities/{id}",
    tags: ["activities"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateActivitySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Actividad actualizado",
        content: { "application/json": { schema: ActivitySchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      404: openApiErrorResponse("Actividad no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const event = await c.var.activityService.update(id, body);
    return c.json(event, 200);
  },
);

activitiesApp.openapi(
  {
    method: "delete",
    path: "/activities/{id}",
    tags: ["activities"],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        description: "Actividad eliminado",
        content: { "application/json": { schema: ActivitySchema } },
      },
      404: openApiErrorResponse("Actividad no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const event = await c.var.activityService.remove(id);
    return c.json(event, 200);
  },
);
