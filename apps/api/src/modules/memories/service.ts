import { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "@/utils/api-error";
import {
  NewMemory,
  NewMemoriesBook,
  MemoryFilters,
  Memory,
  CreateMemoryWithImage,
  CreateNote,
  UpdateMemory,
  UpdateMemoriesBook,
  MemoryWithReactions,
} from "./schema";
import { Database } from "@/supabase-types";
import {
  deleteMemoryMediaByPublicUrl,
  uploadMemoryImage,
} from "@/services/storage";
import { MentionsService } from "@/services/mentions";
import { NotificationsService } from "@/modules/notifications/service";

export class MemoriesService {
  private mentionsService: MentionsService;
  private notificationsService: NotificationsService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.mentionsService = new MentionsService(supabase);
    this.notificationsService = new NotificationsService(supabase);
  }

  private async assertUserInGroup(userId: string, groupId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user for group check:", error);
      throw new ApiException(500, "Error fetching user");
    }

    if (!data?.groupId || data.groupId !== groupId) {
      throw new ApiException(403, "Forbidden");
    }
  }

  /**
   * Get all memories with optional filters
   */
  async getAllMemories(filters?: MemoryFilters): Promise<MemoryWithReactions[]> {
    let query = this.supabase
      .from("memories")
      .select(`
        *,
        reactions:memory_reactions(
          id,
          memory_id,
          user_id,
          sticker_id,
          created_at,
          sticker:shop_items(asset_url)
        )
      `)
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

    // Map reactions to schema
    return (data || []).map((memory: Database["public"]["Tables"]["memories"]["Row"] & { 
      reactions: Array<Database["public"]["Tables"]["memory_reactions"]["Row"] & { 
        sticker: { asset_url: string | null } | null 
      }> 
    }) => ({
      ...memory,
      reactions: (memory.reactions || []).map((r) => ({
        id: r.id,
        memoryId: r.memory_id,
        userId: r.user_id,
        stickerId: r.sticker_id,
        stickerUrl: r.sticker?.asset_url || null,
        createdAt: r.created_at,
      })),
    })) as MemoryWithReactions[];
  }

  /**
   * Get a single memory by ID
   */
  async getMemoryById(id: string): Promise<MemoryWithReactions | null> {
    const { data, error } = await this.supabase
      .from("memories")
      .select(`
        *,
        reactions:memory_reactions(
          id,
          memory_id,
          user_id,
          sticker_id,
          created_at,
          sticker:shop_items(asset_url)
        )
      `)
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

    const memoryData = data as Database["public"]["Tables"]["memories"]["Row"] & { 
      reactions: Array<Database["public"]["Tables"]["memory_reactions"]["Row"] & { 
        sticker: { asset_url: string | null } | null 
      }> 
    };

    return {
      ...memoryData,
      reactions: (memoryData.reactions || []).map((r) => ({
        id: r.id,
        memoryId: r.memory_id,
        userId: r.user_id,
        stickerId: r.sticker_id,
        stickerUrl: r.sticker?.asset_url || null,
        createdAt: r.created_at,
      })),
    } as MemoryWithReactions;
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
    userId: string
  ): Promise<Memory> {
    try {
      // 1. Subir imagen al storage usando el servicio centralizado
      const mediaUrl = await uploadMemoryImage(
        this.supabase,
        memoryData.groupId,
        memoryData.bookId,
        imageFile
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

      // Sync mentions from title and caption
      try {
        await this.mentionsService.syncMentions(
          "memory",
          data.id,
          memoryData.title,
          memoryData.caption
        );

        // Extract mentioned user IDs and create notifications
        const mentionedIds = [
          ...this.mentionsService.extractMentionIds(memoryData.title),
          ...this.mentionsService.extractMentionIds(memoryData.caption),
        ];

        if (mentionedIds.length > 0) {
          // Get the actor's name
          const { data: actor, error: actorError } = await this.supabase
            .from("users")
            .select("displayName")
            .eq("id", userId)
            .single();

          if (!actorError && actor) {
            await this.notificationsService.notifyMentionedUsers(
              mentionedIds,
              userId,
              actor.displayName || "Un usuario",
              "memory",
              data.id,
              memoryData.title || "Sin título"
            );
          }
        }
      } catch (error) {
        console.error("Error syncing mentions or creating notifications:", error);
        // Don't throw - mentions and notifications are not critical
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
   * Update a memories book (baul), only if the user belongs to the book's group.
   */
  async updateMemoriesBook(
    bookId: string,
    patch: UpdateMemoriesBook,
    userId: string
  ) {
    const { data: existing, error: fetchErr } = await this.supabase
      .from("memoriesBooks")
      .select("id, groupId")
      .eq("id", bookId)
      .single();

    if (fetchErr) {
      if (fetchErr.code === "PGRST116") return null;
      console.error("Error fetching memories book:", fetchErr);
      throw new ApiException(500, "Error fetching memories book");
    }

    await this.assertUserInGroup(userId, existing.groupId);

    const { data, error } = await this.supabase
      .from("memoriesBooks")
      .update({ ...patch, updatedAt: new Date().toISOString() })
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      console.error("Error updating memories book:", error);
      throw new ApiException(500, "Error updating memories book");
    }

    return data;
  }

  /**
   * Delete a memories book (baul), only if the user belongs to the book's group.
   * DB cascade will delete related memories.
   */
  async deleteMemoriesBook(bookId: string, userId: string) {
    const { data: existing, error: fetchErr } = await this.supabase
      .from("memoriesBooks")
      .select("id, groupId")
      .eq("id", bookId)
      .single();

    if (fetchErr) {
      if (fetchErr.code === "PGRST116") {
        throw new ApiException(404, "Memories book not found");
      }
      console.error("Error fetching memories book:", fetchErr);
      throw new ApiException(500, "Error fetching memories book");
    }

    await this.assertUserInGroup(userId, existing.groupId);

    const { error } = await this.supabase
      .from("memoriesBooks")
      .delete()
      .eq("id", bookId);

    if (error) {
      console.error("Error deleting memories book:", error);
      throw new ApiException(500, "Error deleting memories book");
    }

    return true;
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

    // Sync mentions from title and caption
    try {
      await this.mentionsService.syncMentions(
        "memory",
        data.id,
        noteData.title,
        noteData.caption
      );

      // Extract mentioned user IDs and create notifications
      const mentionedIds = [
        ...this.mentionsService.extractMentionIds(noteData.title),
        ...this.mentionsService.extractMentionIds(noteData.caption),
      ];

      if (mentionedIds.length > 0) {
        // Get the actor's name
        const { data: actor, error: actorError } = await this.supabase
          .from("users")
          .select("displayName")
          .eq("id", userId)
          .single();

        if (!actorError && actor) {
          await this.notificationsService.notifyMentionedUsers(
            mentionedIds,
            userId,
            actor.displayName || "Un usuario",
            "memory",
            data.id,
            noteData.title
          );
        }
      }
    } catch (error) {
      console.error("Error syncing mentions or creating notifications:", error);
      // Don't throw - mentions and notifications are not critical
    }

    return data;
  }

  /**
   * Update a memory metadata (title/caption) with authorization check.
   */
  async updateMemory(
    memoryId: string,
    patch: UpdateMemory,
    userId: string
  ): Promise<Memory> {
    const memory = await this.getMemoryById(memoryId);
    if (!memory) {
      throw new ApiException(404, "Memory not found");
    }

    if (memory.createdBy !== userId) {
      throw new ApiException(403, "You can only edit your own memories");
    }

    const update: Partial<Pick<Memory, "title" | "caption">> = {};
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.caption !== undefined) update.caption = patch.caption;

    const { data, error } = await this.supabase
      .from("memories")
      .update(update)
      .eq("id", memoryId)
      .select()
      .single();

    if (error) {
      console.error("Error updating memory:", error);
      throw new ApiException(500, "Error updating memory");
    }

    if (!data) {
      throw new ApiException(500, "Failed to update memory");
    }

    // Sync mentions from title and caption
    try {
      // Get previous mentions to know which are new
      const oldMentionIds = await this.mentionsService.getMentionsForEntity(
        "memory",
        data.id
      );

      await this.mentionsService.syncMentions(
        "memory",
        data.id,
        data.title,
        data.caption
      );

      // Extract current mentioned user IDs
      const currentMentionIds = [
        ...this.mentionsService.extractMentionIds(data.title),
        ...this.mentionsService.extractMentionIds(data.caption),
      ];

      // Find new mentions (not present in old mentions)
      const newMentionIds = currentMentionIds.filter(
        (id) => !oldMentionIds.includes(id)
      );

      if (newMentionIds.length > 0) {
        // Get the actor's name
        const { data: actor, error: actorError } = await this.supabase
          .from("users")
          .select("displayName")
          .eq("id", userId)
          .single();

        if (!actorError && actor) {
          await this.notificationsService.notifyMentionedUsers(
            newMentionIds,
            userId,
            actor.displayName || "Un usuario",
            "memory",
            data.id,
            data.title || "Sin título"
          );
        }
      }
    } catch (error) {
      console.error("Error syncing mentions or creating notifications:", error);
      // Don't throw - mentions are not critical
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

    // If the memory has a media URL, delete it from Storage first
    if (memory.mediaUrl && memory.mimeType && memory.mimeType !== "text/note") {
      try {
        await deleteMemoryMediaByPublicUrl(this.supabase, memory.mediaUrl);
      } catch (error) {
        console.error("Error deleting memory media from storage:", error);
        throw new ApiException(500, "Error deleting memory media");
      }
    }

    // Delete mentions first
    try {
      await this.mentionsService.deleteMentionsForEntity("memory", memoryId);
    } catch (error) {
      console.error("Error deleting mentions:", error);
      // Continue with memory deletion even if mentions fail
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

  /**
   * Add or update a reaction to a memory
   */
  async upsertReaction(
    memoryId: string,
    stickerId: string,
    userId: string
  ): Promise<void> {
    // Check if memory exists
    const memory = await this.getMemoryById(memoryId);
    if (!memory) {
      throw new ApiException(404, "Memory not found");
    }

    // Ensure only one reaction per user per memory
    // First try to find existing reaction
    const { data: existingReaction } = await this.supabase
      .from("memory_reactions")
      .select("id")
      .eq("memory_id", memoryId)
      .eq("user_id", userId)
      .single();

    if (existingReaction) {
      // Update existing reaction
      const { error } = await this.supabase
        .from("memory_reactions")
        .update({
          sticker_id: stickerId,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingReaction.id);

      if (error) {
        console.error("Error updating reaction:", error);
        throw new ApiException(500, "Error updating reaction");
      }
    } else {
      // Create new reaction
      const { error } = await this.supabase.from("memory_reactions").insert({
        memory_id: memoryId,
        user_id: userId,
        sticker_id: stickerId,
      });

      if (error) {
        console.error("Error creating reaction:", error);
        throw new ApiException(500, "Error creating reaction");
      }
    }
  }

  /**
   * Remove a reaction from a memory
   */
  async removeReaction(memoryId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("memory_reactions")
      .delete()
      .eq("memory_id", memoryId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting reaction:", error);
      throw new ApiException(500, "Error deleting reaction");
    }
  }
}
