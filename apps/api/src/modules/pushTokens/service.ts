import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";

export interface PushTokenData {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
}

export class PushTokensService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Store or update a push token for a user
   */
  async upsertPushToken(data: PushTokenData): Promise<void> {
    // First, check if token exists
    const { data: existing, error: selectError } = await this.supabase
      .from("device_tokens")
      .select("id, user_id")
      .eq("expo_push_token", data.token)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error checking existing token:", selectError);
      throw new Error("Failed to check existing token");
    }

    if (existing) {
      // Update existing token
      const { error } = await this.supabase
        .from("device_tokens")
        .update({
          user_id: data.userId,
          last_seen_at: new Date().toISOString(),
          is_active: true,
        })
        .eq("expo_push_token", data.token);

      if (error) {
        console.error("Error updating device token:", error);
        throw new Error("Failed to update device token");
      }
    } else {
      // Insert new token
      const { error } = await this.supabase
        .from("device_tokens")
        .insert({
          user_id: data.userId,
          expo_push_token: data.token,
          platform: data.platform,
          device_id: data.deviceId,
        });

      if (error) {
        console.error("Error inserting device token:", error);
        throw new Error("Failed to store device token");
      }
    }
  }

  /**
   * Get all push tokens for a user
   */
  async getPushTokensByUser(userId: string): Promise<PushTokenData[]> {
    const { data, error } = await this.supabase
      .from("device_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching device tokens:", error);
      throw new Error("Failed to fetch device tokens");
    }

    return (data || []).map(token => ({
      userId: token.user_id,
      token: token.expo_push_token,
      platform: token.platform as 'ios' | 'android',
      deviceId: token.device_id || undefined,
    }));
  }

  /**
   * Remove a push token (set inactive)
   */
  async removePushToken(userId: string, token: string): Promise<void> {
    const { error } = await this.supabase
      .from("device_tokens")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("expo_push_token", token);

    if (error) {
      console.error("Error deactivating device token:", error);
      throw new Error("Failed to deactivate device token");
    }
  }

  /**
   * Remove all push tokens for a user (set inactive)
   */
  async removeAllPushTokensForUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("device_tokens")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Error deactivating device tokens:", error);
      throw new Error("Failed to deactivate device tokens");
    }
  }
}