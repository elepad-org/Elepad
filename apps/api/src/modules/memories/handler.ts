import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CreateNoteSchema,
  MemoriesBookSchema,
  MemoryFiltersSchema,
  MemorySchema,
  MemorySchemaWithReactions,
  NewMemoriesBookSchema,
  UpdateMemorySchema,
  UpdateMemoriesBookSchema,
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

// Middleware de autenticación para todas las rutas de memories.
memoriesApp.use("/memories/*", withAuth);

// Middleware para inyectar el MemoriesService en cada request.
memoriesApp.use("/memories/*", async (c, next) => {
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
              data: z.array(MemorySchemaWithReactions),
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

    const [memories, total] = await Promise.all([
      c.var.memoriesService.getAllMemories(filters),
      c.var.memoriesService.getMemoriesCount(filters),
    ]);

    return c.json(
      {
        data: memories,
        total: total,
        limit: filters.limit,
        offset: filters.offset,
      },
      200
    );
  }
);

// GET /memories/books - Listar baules (memoriesBooks) del grupo del usuario
memoriesApp.openapi(
  {
    method: "get",
    path: "/memories/books",
    tags: ["memories"],
    request: {
      query: z.object({ groupId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of memories books (baules)",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(MemoriesBookSchema) }),
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("Forbidden"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { groupId } = c.req.valid("query");
    const user = c.var.user;

    // Asegurar que el usuario pertenece a ese grupo
    const { data: userRow, error: userErr } = await c.var.supabase
      .from("users")
      .select("groupId")
      .eq("id", user.id)
      .single();

    if (userErr) {
      throw new ApiException(500, "Error fetching user");
    }

    if (!userRow?.groupId || userRow.groupId !== groupId) {
      throw new ApiException(403, "Forbidden");
    }

    const books = await c.var.memoriesService.getMemoriesBooks(groupId);
    return c.json({ data: books }, 200);
  }
);

// POST /memories/books - Crear baul
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/books",
    tags: ["memories"],
    operationId: "createMemoriesBook",
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewMemoriesBookSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Memories book created",
        content: {
          "application/json": {
            schema: MemoriesBookSchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("Forbidden"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const user = c.var.user;

    const { data: userRow, error: userErr } = await c.var.supabase
      .from("users")
      .select("groupId")
      .eq("id", user.id)
      .single();
    if (userErr) {
      throw new ApiException(500, "Error fetching user");
    }
    if (!userRow?.groupId || userRow.groupId !== body.groupId) {
      throw new ApiException(403, "Forbidden");
    }

    const created = await c.var.memoriesService.createMemoriesBook(body);
    return c.json(created, 201);
  }
);

// PATCH /memories/books/{id} - Editar baul
memoriesApp.openapi(
  {
    method: "patch",
    path: "/memories/books/{id}",
    tags: ["memories"],
    operationId: "updateMemoriesBook",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateMemoriesBookSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Memories book updated",
        content: {
          "application/json": {
            schema: MemoriesBookSchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("Forbidden"),
      404: openApiErrorResponse("Not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.var.user;

    const updated = await c.var.memoriesService.updateMemoriesBook(
      id,
      body,
      user.id
    );
    if (!updated) {
      throw new ApiException(404, "Memories book not found");
    }
    return c.json(updated, 200);
  }
);

// DELETE /memories/books/{id} - Eliminar baul
memoriesApp.openapi(
  {
    method: "delete",
    path: "/memories/books/{id}",
    tags: ["memories"],
    operationId: "deleteMemoriesBook",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Memories book deleted",
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("Forbidden"),
      404: openApiErrorResponse("Not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const user = c.var.user;

    await c.var.memoriesService.deleteMemoriesBook(id, user.id);
    return c.json({ message: "Memories book deleted" }, 200);
  }
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
            schema: MemorySchemaWithReactions,
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
  }
);

// PATCH /memories/{id} - Editar metadata (título/descripcion) de una memory
memoriesApp.openapi(
  {
    method: "patch",
    path: "/memories/{id}",
    tags: ["memories"],
    operationId: "updateMemory",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateMemorySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Memory updated successfully",
        content: {
          "application/json": {
            schema: MemorySchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse("You can only edit your own memories"),
      404: openApiErrorResponse("Memory not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const patch = c.req.valid("json");
    const user = c.var.user;

    const updated = await c.var.memoriesService.updateMemory(
      id,
      patch,
      user.id
    );
    return c.json(updated, 200);
  }
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
        "File too large (max 50MB for images/audio, 100MB for video)"
      ),
      415: openApiErrorResponse(
        "Unsupported media type - only images, videos, and audio files allowed"
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
        `File type not allowed: ${
          mediaFile.type
        }. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Validar tamaño del archivo (máximo 50MB para videos, 50MB para otros)
    const isVideo = mediaFile.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 50 * 1024 * 1024; // 50MB para video, 50MB para otros
    if (mediaFile.size > maxSize) {
      const maxSizeText = isVideo ? "50MB" : "50MB";
      throw new ApiException(
        413,
        `File size too large. Maximum size is ${maxSizeText}`
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
      user.id
    );

    return c.json(createdMemory, 201);
  }
);

// POST /memories/note - Crear una nota (memory sin archivo multimedia)
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/note",
    tags: ["memories"],
    operationId: "createNote",
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateNoteSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Note created successfully",
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
    const noteData = c.req.valid("json");
    const user = c.var.user;

    const createdNote = await c.var.memoriesService.createNote(
      noteData,
      user.id
    );

    return c.json(createdNote, 201);
  }
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
  }
);

// POST /memories/{id}/reaction - Agregar o actualizar reacción
memoriesApp.openapi(
  {
    method: "post",
    path: "/memories/{id}/reaction",
    tags: ["memories"],
    operationId: "addReaction",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({ stickerId: z.string().uuid() }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Reaction added/updated successfully",
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      404: openApiErrorResponse("Memory not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { id } = c.req.valid("param");
    const { stickerId } = c.req.valid("json");
    const user = c.var.user;

    await c.var.memoriesService.upsertReaction(id, stickerId, user.id);

    return c.json({ message: "Reaction added/updated successfully" }, 200);
  }
);
