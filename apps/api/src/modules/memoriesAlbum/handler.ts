import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  TranscriptionSchema,
  CreateAlbumRequestSchema,
  AlbumWithPagesSchema,
  AlbumSchema,
  GetAlbumsQuerySchema,
} from "./schema";
import { MemoriesAlbumService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";
import { withAuth } from "@/middleware/auth";

export const albumApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    memoriesAlbumService: MemoriesAlbumService;
  }
}

// Require auth for the album endpoints
albumApp.use("/album/*", withAuth);

// Inject service
albumApp.use("/album/*", async (c, next) => {
  const service = new MemoriesAlbumService(c.var.supabase);
  c.set("memoriesAlbumService", service);
  await next();
});

// POST /album/transcribe - Accept audio file and transcribe via Gemini
albumApp.openapi(
  {
    method: "post",
    path: "/album/transcribe",
    tags: ["album"],
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              audio: z.instanceof(File).openapi({
                type: "string",
                format: "binary",
                description: "Audio file to transcribe (only audio/* allowed)",
              }),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Transcription result",
        content: { "application/json": { schema: TranscriptionSchema } },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      415: openApiErrorResponse("Unsupported media type"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = await c.req.parseBody();

    const audioFile = body.audio as File;
    if (!audioFile || !(audioFile instanceof File)) {
      throw new ApiException(400, "Audio file is required");
    }

    if (!audioFile.type || !audioFile.type.startsWith("audio/")) {
      throw new ApiException(
        415,
        "Unsupported media type - only audio files allowed"
      );
    }

    // Limit size to 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      throw new ApiException(413, "File too large (max 50MB)");
    }

    const transcription =
      await c.var.memoriesAlbumService.transcribeAudio(audioFile);

    return c.json({ text: transcription }, 200);
  }
);

// POST /album/create - Create a new album with AI-generated narratives
albumApp.openapi(
  {
    method: "post",
    path: "/album/create",
    tags: ["album"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateAlbumRequestSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Album created and processing started",
      },
      400: openApiErrorResponse("Invalid request or memories not found"),
      401: openApiErrorResponse("Unauthorized"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const user = c.var.user;

    if (!user) {
      throw new ApiException(401, "User not authenticated");
    }

    const body = await c.req.json();
    const validated = CreateAlbumRequestSchema.parse(body);

    const album = await c.var.memoriesAlbumService.createAlbum(
      user.id,
      validated
    );

    return c.json(album, 201);
  }
);

// GET /album - Get all albums for the user's family group
albumApp.openapi(
  {
    method: "get",
    path: "/album",
    tags: ["album"],
    request: {
      query: GetAlbumsQuerySchema,
    },
    responses: {
      200: {
        description: "List of albums",
        content: { "application/json": { schema: z.array(AlbumSchema) } },
      },
      401: openApiErrorResponse("Unauthorized"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const user = c.var.user;
    if (!user) {
      throw new ApiException(401, "User not authenticated");
    }

    const query = c.req.valid("query");

    const albums = await c.var.memoriesAlbumService.getAllAlbumsForUserGroup(
      user.id,
      query.limit,
      query.offset
    );

    return c.json(albums, 200);
  }
);

// GET /album/:id - Get a specific album with its pages
albumApp.openapi(
  {
    method: "get",
    path: "/album/{id}",
    tags: ["album"],
    request: {
      params: z.object({
        id: z.uuid(),
      }),
    },
    responses: {
      200: {
        description: "Album with pages",
        content: { "application/json": { schema: AlbumWithPagesSchema } },
      },
      401: openApiErrorResponse("Unauthorized"),
      404: openApiErrorResponse("Album not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const user = c.var.user;
    if (!user) {
      throw new ApiException(401, "User not authenticated");
    }

    const { id } = c.req.valid("param");

    const albumWithPages = await c.var.memoriesAlbumService.getAlbumById(user.id, id);

    return c.json(albumWithPages, 200);
  }
);
