import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  SpotifyArtistRequestSchema,
  SpotifyArtistResponseSchema,
  SpotifySearchRequestSchema,
} from "./schema";
import { SpotifyService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";
import { withAuth } from "@/middleware/auth";

export const spotifyApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    spotifyService: SpotifyService;
  }
}

// Require auth for Spotify endpoints
spotifyApp.use("/spotify/*", withAuth);

// Inject service
spotifyApp.use("/spotify/*", async (c, next) => {
  const service = new SpotifyService(c.var.supabase);
  c.set("spotifyService", service);
  await next();
});

// POST /spotify/artist - Get artist data from Spotify
spotifyApp.openapi(
  {
    method: "post",
    path: "/spotify/artist",
    tags: ["spotify"],
    summary: "Get artist data from Spotify",
    request: {
      body: {
        content: {
          "application/json": {
            schema: SpotifyArtistRequestSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Artist data from Spotify",
        content: {
          "application/json": {
            schema: SpotifyArtistResponseSchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      404: openApiErrorResponse("Artist not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const user = c.var.user;
    if (!user) {
      throw new ApiException(401, "User not authenticated");
    }

    const body = await c.req.json();
    const validated = SpotifyArtistRequestSchema.parse(body);

    const artistData = await c.var.spotifyService.getArtist(
      validated.artistId
    );

    return c.json(artistData, 200);
  }
);

// POST /spotify/search - Search on Spotify
spotifyApp.openapi(
  {
    method: "post",
    path: "/spotify/search",
    tags: ["spotify"],
    summary: "Search tracks, artists or albums on Spotify",
    request: {
      body: {
        content: {
          "application/json": {
            schema: SpotifySearchRequestSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Search results from Spotify",
        content: {
          "application/json": {
            schema: z.object({
              tracks: z.any().optional(),
              artists: z.any().optional(),
              albums: z.any().optional(),
            }),
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
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
    const validated = SpotifySearchRequestSchema.parse(body);

    const searchResults = await c.var.spotifyService.search(
      validated.query,
      validated.type,
      validated.limit
    );

    return c.json(searchResults, 200);
  }
);
