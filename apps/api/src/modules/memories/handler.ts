import { OpenAPIHono, z } from "@hono/zod-openapi";
import { MemorySchema, MemoryFiltersSchema } from "./schema";
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

// Middleware de autenticación para todas las rutas de memories
memoriesApp.use("/memories*", withAuth);

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

// POST /memories/upload - Crear una nueva memory con archivo multimedia (imagen, video o audio)
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/upload",
    tags: ["memories"],
    operationId: "createMemoryWithMedia",
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
                description: "Media file to upload (image, video, or audio)",
              }),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Memory with media created successfully",
        content: {
          "application/json": {
            schema: MemorySchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request or invalid media file"),
      401: openApiErrorResponse("Unauthorized"),
      413: openApiErrorResponse(
        "File too large (max 50MB for images/audio, 100MB for video)",
      ),
      415: openApiErrorResponse(
        "Unsupported media type - only images, videos, and audio files allowed",
      ),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = await c.req.parseBody();
    const user = c.var.user;

    // Validar que se envió un archivo multimedia
    const mediaFile = body.image as File;
    if (!mediaFile || !(mediaFile instanceof File)) {
      throw new ApiException(400, "Media file is required");
    }

    // Validar tipo de archivo (imágenes, videos, audios)
    const allowedTypes = [
      // Imágenes
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Videos
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
      // Audios
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/aac",
      "audio/flac",
      "audio/webm",
      "audio/m4a", // Formato M4A usado por iOS/React Native
      "audio/x-m4a", // Variante de M4A
      "audio/3gp", // Formato 3GP para Android
      "audio/amr", // AMR usado en algunos dispositivos Android
    ];

    if (!allowedTypes.includes(mediaFile.type)) {
      throw new ApiException(
        415,
        `File type not allowed: ${mediaFile.type}. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Validar tamaño del archivo (máximo 50MB para videos, 50MB para otros)
    const isVideo = mediaFile.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 50 * 1024 * 1024; // 50MB para video, 50MB para otros
    if (mediaFile.size > maxSize) {
      const maxSizeText = isVideo ? "50MB" : "50MB";
      throw new ApiException(
        413,
        `File size too large. Maximum size is ${maxSizeText}`,
      );
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
      mediaFile,
      user.id,
    );

    return c.json(createdMemory, 201);
  },
);

// DELETE /memories/{id} - Eliminar una memory
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
