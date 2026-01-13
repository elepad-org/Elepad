import { z } from "@hono/zod-openapi";

// Respuesta de transcripción
export const TranscriptionSchema = z
  .object({
    text: z.string(),
  })
  .openapi("Transcription");

export type Transcription = z.infer<typeof TranscriptionSchema>;

export const TranscribeAudioRequest = z
  .object({})
  .openapi("TranscribeAudioRequest");

export type TranscribeAudio = z.infer<typeof TranscribeAudioRequest>;

// Album Page Schema
export const AlbumPageSchema = z
  .object({
    id: z.uuid(),
    albumId: z.uuid(),
    memoryId: z.uuid(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    order: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
  })
  .openapi("AlbumPage");

export type AlbumPage = z.infer<typeof AlbumPageSchema>;

// Album Schema
export const AlbumSchema = z
  .object({
    id: z.uuid(),
    groupId: z.uuid(),
    createdBy: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(["processing", "ready", "error"]),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
  })
  .openapi("Album");

export type Album = z.infer<typeof AlbumSchema>;

// Schema for creating an album
export const CreateAlbumRequestSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000),
    memoryIds: z.array(z.uuid()).min(1).max(50),
  })
  .openapi("CreateAlbumRequest");

export type CreateAlbumRequest = z.infer<typeof CreateAlbumRequestSchema>;

// Schema for album response with pages
export const AlbumWithPagesSchema = z
  .object({
    id: z.uuid(),
    groupId: z.uuid(),
    createdBy: z.uuid(),
    title: z.string(),
    description: z.string(),
    status: z.enum(["processing", "ready", "error"]),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    pages: z.array(AlbumPageSchema),
  })
  .openapi("AlbumWithPages");

export type AlbumWithPages = z.infer<typeof AlbumWithPagesSchema>;

// Schema for getting albums with filters
export const GetAlbumsQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
  })
  .openapi("GetAlbumsQuery");

export type GetAlbumsQuery = z.infer<typeof GetAlbumsQuerySchema>;