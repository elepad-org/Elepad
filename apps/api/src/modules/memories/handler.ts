import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  MemorySchema,
  MemoryFiltersSchema,
  NewMemorySchema,
  CreateMemoryWithImageSchema,
} from "./schema";
import { MemoriesService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";
import { withAuth } from "@/middleware/auth";

export const memoriesApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    memoriesService: MemoriesService;
    user: { id: string };
  }
}

// Middleware para inyectar el MemoriesService en cada request
memoriesApp.use("*", async (c, next) => {
  const memoriesService = new MemoriesService(c.var.supabase);
  c.set("memoriesService", memoriesService);
  await next();
});

// GET /memories - Traer todas las memories con filtros opcionales
memoriesApp.openapi(
  {
    method: "get",
    path: "/memories",
    tags: ["memories"],
    request: {
      query: MemoryFiltersSchema,
    },
    responses: {
      200: {
        description: "List of memories",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(MemorySchema),
              total: z.number(),
              limit: z.number(),
              offset: z.number(),
            }),
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const filters = c.req.valid("query");

    const memories = await c.var.memoriesService.getAllMemories(filters);

    return c.json(
      {
        data: memories,
        total: memories.length,
        limit: filters.limit,
        offset: filters.offset,
      },
      200,
    );
  },
);

// GET /memories/{id} - Traer una memory específica por ID
memoriesApp.openapi(
  {
    method: "get",
    path: "/memories/{id}",
    tags: ["memories"],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Memory details",
        content: {
          "application/json": {
            schema: MemorySchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      404: openApiErrorResponse("Memory not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");

    const memory = await c.var.memoriesService.getMemoryById(id);

    if (!memory) {
      throw new ApiException(404, "Memory not found");
    }

    return c.json(memory, 200);
  },
);

// Aplicar middleware de autenticación para endpoints que lo requieran
memoriesApp.use("/memories/create", withAuth);

// POST /memories/create - Crear una nueva memory (requiere autenticación)
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/create",
    tags: ["memories"],
    operationId: "createMemory",
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewMemorySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Memory created successfully",
        content: {
          "application/json": {
            schema: MemorySchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");

    const createdMemory = await c.var.memoriesService.createMemory(body);

    return c.json(createdMemory, 201);
  },
);

// Aplicar middleware de autenticación para el endpoint de upload de imagen
memoriesApp.use("/memories/upload", withAuth);

// POST /memories/upload - Crear una nueva memory con imagen (requiere autenticación)
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/upload",
    tags: ["memories"],
    operationId: "createMemoryWithImage",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              bookId: z.string().uuid(),
              groupId: z.string().uuid(),
              title: z.string().optional(),
              caption: z.string().optional(),
              image: z.instanceof(File).openapi({
                type: "string",
                format: "binary",
                description: "Image file to upload",
              }),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Memory with image created successfully",
        content: {
          "application/json": {
            schema: MemorySchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request or invalid image file"),
      401: openApiErrorResponse("Unauthorized"),
      413: openApiErrorResponse("File too large"),
      415: openApiErrorResponse("Unsupported media type"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = await c.req.parseBody();
    const user = c.var.user;

    // Validar que se envió una imagen
    const imageFile = body.image as File;
    if (!imageFile || !(imageFile instanceof File)) {
      throw new ApiException(400, "Image file is required");
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new ApiException(
        415,
        "Only image files are allowed (JPEG, PNG, GIF, WebP)",
      );
    }

    // Validar tamaño del archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (imageFile.size > maxSize) {
      throw new ApiException(413, "File size too large. Maximum size is 50MB");
    }

    // Preparar datos para crear la memory
    const memoryData = {
      bookId: body.bookId as string,
      groupId: body.groupId as string,
      title: body.title as string | undefined,
      caption: body.caption as string | undefined,
    };

    // Validar que los campos requeridos están presentes
    if (!memoryData.bookId || !memoryData.groupId) {
      throw new ApiException(400, "bookId and groupId are required");
    }

    // Crear la memory con imagen
    const createdMemory = await c.var.memoriesService.createMemoryWithImage(
      memoryData,
      imageFile,
      user.id,
    );

    return c.json(createdMemory, 201);
  },
);

// Aplicar middleware de autenticación para el endpoint de eliminación
memoriesApp.use("/memories/:id", withAuth);

// DELETE /memories/{id} - Eliminar una memory (requiere autenticación)
memoriesApp.openapi(
  {
    method: "delete",
    path: "/memories/{id}",
    tags: ["memories"],
    operationId: "deleteMemory",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Memory deleted successfully",
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("You can only delete your own memories"),
      404: openApiErrorResponse("Memory not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.var.user;

    await c.var.memoriesService.deleteMemory(id, user.id);

    return c.json({ message: "Memory deleted successfully" }, 200);
  },
);
