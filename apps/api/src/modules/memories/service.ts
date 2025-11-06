import { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "@/utils/api-error";
import {
  NewMemory,
  NewMemoriesBook,
  MemoryFilters,
  Memory,
  CreateMemoryWithImage,
  CreateNote,
} from "./schema";
import { Database } from "@/supabase-types";
import { uploadMemoryImage } from "@/services/storage";

export class MemoriesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all memories with optional filters
   */
  async getAllMemories(filters?: MemoryFilters): Promise<Memory[]> {
    let query = this.supabase
      .from("memories")
      .select("*")
      .order("createdAt", { ascending: false });

    // Apply filters if provided
    if (filters?.bookId) {
      query = query.eq("bookId", filters.bookId);
    }
    if (filters?.groupId) {
      query = query.eq("groupId", filters.groupId);
    }
    if (filters?.createdBy) {
      query = query.eq("createdBy", filters.createdBy);
    }

    // Apply pagination
    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching memories:", error);
      throw new ApiException(500, "Error fetching memories");
    }

    return data || [];
  }

  /**
   * Get a single memory by ID
   */
  async getMemoryById(id: string): Promise<Memory | null> {
    const { data, error } = await this.supabase
      .from("memories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching memory:", error);
      throw new ApiException(500, "Error fetching memory");
    }

    return data;
  }

  /**
   * Create a new memory
   */
  async createMemory(newMemory: NewMemory): Promise<Memory> {
    const { data, error } = await this.supabase
      .from("memories")
      .insert(newMemory)
      .select()
      .single();

    if (error) {
      console.error("Error creating memory:", error);
      throw new ApiException(500, "Error creating memory");
    }

    if (!data) {
      throw new ApiException(500, "Failed to create memory");
    }

    return data;
  }

  /**
   * Create a new memory with image upload to Supabase Storage
   */
  async createMemoryWithImage(
    memoryData: CreateMemoryWithImage,
    imageFile: File,
    userId: string,
  ): Promise<Memory> {
    try {
      // 1. Subir imagen al storage usando el servicio centralizado
      const mediaUrl = await uploadMemoryImage(
        this.supabase,
        memoryData.groupId,
        imageFile,
      );

      // 2. Crear el registro en la tabla memories
      const newMemory: NewMemory = {
        bookId: memoryData.bookId,
        groupId: memoryData.groupId,
        createdBy: userId,
        title: memoryData.title,
        caption: memoryData.caption,
        mediaUrl,
        mimeType: imageFile.type,
      };

      const { data, error } = await this.supabase
        .from("memories")
        .insert(newMemory)
        .select()
        .single();

      if (error) {
        console.error("Error creating memory in database:", error);
        throw new ApiException(500, "Error creating memory");
      }

      if (!data) {
        throw new ApiException(500, "Failed to create memory");
      }

      return data;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      console.error("Unexpected error in createMemoryWithImage:", error);
      throw new ApiException(500, "Internal server error");
    }
  }

  /**
   * Get all memories books for a group
   */
  async getMemoriesBooks(groupId: string) {
    const { data, error } = await this.supabase
      .from("memoriesBooks")
      .select("*")
      .eq("groupId", groupId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching memories books:", error);
      throw new ApiException(500, "Error fetching memories books");
    }

    return data || [];
  }

  /**
   * Create a new memories book
   */
  async createMemoriesBook(newBook: NewMemoriesBook) {
    const { data, error } = await this.supabase
      .from("memoriesBooks")
      .insert(newBook)
      .select()
      .single();

    if (error) {
      console.error("Error creating memories book:", error);
      throw new ApiException(500, "Error creating memories book");
    }

    if (!data) {
      throw new ApiException(500, "Failed to create memories book");
    }

    return data;
  }

  /**
   * Create a note (memory without multimedia file)
   */
  async createNote(noteData: CreateNote, userId: string): Promise<Memory> {
    const newMemory: NewMemory = {
      bookId: noteData.bookId,
      groupId: noteData.groupId,
      createdBy: userId,
      title: noteData.title,
      caption: noteData.caption,
      mediaUrl: undefined, // No media URL for notes
      mimeType: "text/note", // Special mime type to identify notes
    };

    const { data, error } = await this.supabase
      .from("memories")
      .insert(newMemory)
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      throw new ApiException(500, "Error creating note");
    }

    if (!data) {
      throw new ApiException(500, "Failed to create note");
    }

    return data;
  }

  /**
   * Delete a memory (with authorization check)
   */
  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    // First check if the memory exists and user has permission
    const memory = await this.getMemoryById(memoryId);
    if (!memory) {
      throw new ApiException(404, "Memory not found");
    }

    // Check if user is the creator of the memory
    if (memory.createdBy !== userId) {
      // Optionally, you could also check if user is owner of the group
      throw new ApiException(403, "You can only delete your own memories");
    }

    const { error } = await this.supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);

    if (error) {
      console.error("Error deleting memory:", error);
      throw new ApiException(500, "Error deleting memory");
    }

    return true;
  }
}
