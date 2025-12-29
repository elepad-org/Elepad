import { z } from "@hono/zod-openapi";

// Schema para MemoriesBooks
export const MemoriesBookSchema = z
  .object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    title: z.string().nullable(),
    description: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    createdAt: z.string().datetime(), // timestamp with time zone como string ISO
    updatedAt: z.string().datetime().optional(),
  })
  .openapi("MemoriesBook");

export type MemoriesBook = z.infer<typeof MemoriesBookSchema>;

// Schema para crear un nuevo MemoriesBook
export const NewMemoriesBookSchema = z
  .object({
    groupId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    color: z.string().min(1),
  })
  .openapi("NewMemoriesBook");

export type NewMemoriesBook = z.infer<typeof NewMemoriesBookSchema>;

// Schema para actualizar un MemoriesBook
export const UpdateMemoriesBookSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    color: z.string().min(1).optional(),
  })
  .strict()
  .openapi("UpdateMemoriesBook");

export type UpdateMemoriesBook = z.infer<typeof UpdateMemoriesBookSchema>;

// Schema para Memories
export const MemorySchema = z
  .object({
    id: z.string().uuid(),
    bookId: z.string().uuid(),
    groupId: z.string().uuid(),
    createdBy: z.string().uuid(),
    title: z.string().nullable(),
    caption: z.string().nullable(),
    mediaUrl: z.string().nullable(),
    mimeType: z.string().nullable(),
    createdAt: z.string().datetime(), // timestamp with time zone como string ISO
  })
  .openapi("Memory");

export type Memory = z.infer<typeof MemorySchema>;

// Schema para crear una nueva Memory
export const NewMemorySchema = z
  .object({
    bookId: z.string().uuid(),
    groupId: z.string().uuid(),
    createdBy: z.string().uuid(),
    title: z.string().optional(),
    caption: z.string().optional(),
    mediaUrl: z.string().optional(),
    mimeType: z.string().optional(),
  })
  .openapi("NewMemory");

export type NewMemory = z.infer<typeof NewMemorySchema>;

// Schema para actualizar una Memory
export const UpdateMemorySchema = z
  .object({
    title: z.string().min(1).optional(),
    caption: z.string().optional(),
  })
  .strict()
  .openapi("UpdateMemory");

export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;

// Schema para filtros/consultas
export const MemoryFiltersSchema = z
  .object({
    bookId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
    createdBy: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
  })
  .openapi("MemoryFilters");

export type MemoryFilters = z.infer<typeof MemoryFiltersSchema>;

// Schema para crear memory con imagen (multipart/form-data)
export const CreateMemoryWithImageSchema = z
  .object({
    bookId: z.string().uuid(),
    groupId: z.string().uuid(),
    title: z.string().min(1).optional(),
    caption: z.string().optional(),
    // La imagen se manejará como File en el handler
  })
  .openapi("CreateMemoryWithImage");

export type CreateMemoryWithImage = z.infer<typeof CreateMemoryWithImageSchema>;

// Schema para crear una nota (memory sin archivo multimedia)
export const CreateNoteSchema = z
  .object({
    bookId: z.string().uuid(),
    groupId: z.string().uuid(),
    title: z.string().min(1),
    caption: z.string().optional(),
  })
  .openapi("CreateNote");

export type CreateNote = z.infer<typeof CreateNoteSchema>;
