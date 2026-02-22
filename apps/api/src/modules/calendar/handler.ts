import { OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { CalendarService } from "./service";
import { GenerateCalendarBodySchema, GenerateCalendarResponseSchema } from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const calendarApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    calendarService: CalendarService;
  }
}

calendarApp.use("/calendar/*", async (c, next) => {
  c.set("calendarService", new CalendarService(c.var.supabase));
  await next();
});

calendarApp.openapi(
  {
    method: "post",
    path: "/calendar/generate",
    tags: ["calendar"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: GenerateCalendarBodySchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Calendario generado exitosamente",
        content: {
          "application/json": { schema: GenerateCalendarResponseSchema },
        },
      },
      400: openApiErrorResponse("Solicitud inválida"),
      401: openApiErrorResponse("No autorizado"),
      403: openApiErrorResponse("Acceso denegado"),
      404: openApiErrorResponse("Sin actividades en el rango seleccionado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");

    const authenticatedUserId = c.var.userId;
    if (body.userId !== authenticatedUserId) {
      return c.json(
        { error: { message: "Acceso denegado: no puedes exportar el calendario de otro usuario" } },
        403,
      );
    }

    const { BASE_URL = "" } = env<{ BASE_URL: string }>(c);
    const baseUrl = BASE_URL || new URL(c.req.url).origin;

    const { calendarId, feedUrl } = await c.var.calendarService.generateCalendar(body, baseUrl);

    return c.json(
      {
        calendarId,
        feedUrl,
        message: `Se exportaron actividades del ${body.startDate} al ${body.endDate}. Copia la URL en "Desde URL" de Google Calendar para sincronizar.`,
      },
      201,
    );
  },
);

calendarApp.openapi(
  {
    method: "get",
    path: "/calendar/feed/{calendarId}",
    tags: ["calendar"],
    request: {
      params: z.object({ calendarId: z.uuid() }),
    },
    responses: {
      200: {
        description: "Archivo iCalendar (.ics)",
        content: { "text/calendar": { schema: z.string() } },
      },
      404: openApiErrorResponse("Calendario no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { calendarId } = c.req.valid("param");
    const icsContent = await c.var.calendarService.getCalendarFeed(calendarId);

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="calendar.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }) as never;
  },
);
