import { z } from "@hono/zod-openapi";

// Schema for requesting artist data
export const SpotifyArtistRequestSchema = z
  .object({
    artistId: z.string().min(1).openapi({
      description: "Spotify artist ID",
      example: "4Z8W4fKeB5YxbusRsdQVPb",
    }),
  })
  .openapi("SpotifyArtistRequest");

export type SpotifyArtistRequest = z.infer<typeof SpotifyArtistRequestSchema>;

// Schema for artist response from Spotify
export const SpotifyArtistResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    genres: z.array(z.string()),
    popularity: z.number(),
    followers: z.object({
      total: z.number(),
    }),
    images: z.array(
      z.object({
        url: z.string(),
        height: z.number(),
        width: z.number(),
      })
    ),
    external_urls: z.object({
      spotify: z.string(),
    }),
  })
  .openapi("SpotifyArtistResponse");

export type SpotifyArtistResponse = z.infer<typeof SpotifyArtistResponseSchema>;

// Schema for searching tracks
export const SpotifySearchRequestSchema = z
  .object({
    query: z.string().min(1).openapi({
      description: "Search query",
      example: "Creep",
    }),
    type: z.enum(["track", "artist", "album"]).default("track").openapi({
      description: "Type of search",
    }),
    limit: z.coerce.number().int().positive().max(50).default(20).openapi({
      description: "Number of results to return",
    }),
  })
  .openapi("SpotifySearchRequest");

export type SpotifySearchRequest = z.infer<typeof SpotifySearchRequestSchema>;
