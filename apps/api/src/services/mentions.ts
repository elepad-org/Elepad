import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";

type EntityType = "memory" | "activity" | "puzzle";

export class MentionsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Extract user IDs from text with mentions in format <@user_id>
   */
  private extractMentionIds(text: string | null | undefined): string[] {
    if (!text) return [];

    const mentionRegex = /<@([a-zA-Z0-9-]+)>/g;
    const matches = text.matchAll(mentionRegex);

    const ids = new Set<string>();
    for (const match of matches) {
      if (match[1]) {
        ids.add(match[1]);
      }
    }

    return Array.from(ids);
  }

  /**
   * Sync mentions for an entity
   * Deletes old mentions and creates new ones based on text content
   */
  async syncMentions(
    entityType: EntityType,
    entityId: string,
    ...textFields: (string | null | undefined)[]
  ): Promise<void> {
    // Extract all mention IDs from all text fields
    const allMentionIds = new Set<string>();
    for (const text of textFields) {
      const ids = this.extractMentionIds(text);
      ids.forEach((id) => allMentionIds.add(id));
    }

    // Delete all existing mentions for this entity
    const { error: deleteError } = await this.supabase
      .from("mentions")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (deleteError) {
      console.error("Error deleting old mentions:", deleteError);
      throw new Error("Failed to delete old mentions");
    }

    // Create new mentions if there are any
    if (allMentionIds.size > 0) {
      const mentionsToCreate = Array.from(allMentionIds).map((userId) => ({
        mentioned_user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
      }));

      const { error: insertError } = await this.supabase
        .from("mentions")
        .insert(mentionsToCreate);

      if (insertError) {
        console.error("Error creating mentions:", insertError);
        throw new Error("Failed to create mentions");
      }
    }
  }

  /**
   * Delete all mentions for an entity
   */
  async deleteMentionsForEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("mentions")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (error) {
      console.error("Error deleting mentions:", error);
      throw new Error("Failed to delete mentions");
    }
  }

  /**
   * Get all mentions for an entity
   */
  async getMentionsForEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("mentions")
      .select("mentioned_user_id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (error) {
      console.error("Error fetching mentions:", error);
      throw new Error("Failed to fetch mentions");
    }

    return data?.map((m) => m.mentioned_user_id) || [];
  }

  /**
   * Get all entities where a user is mentioned
   */
  async getEntitiesForUser(
    userId: string,
    entityType: EntityType
  ): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("mentions")
      .select("entity_id")
      .eq("mentioned_user_id", userId)
      .eq("entity_type", entityType);

    if (error) {
      console.error("Error fetching user mentions:", error);
      throw new Error("Failed to fetch user mentions");
    }

    return data?.map((m) => m.entity_id) || [];
  }
}
