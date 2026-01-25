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
    const { error } = await this.supabase
      .from("push_tokens")
      .upsert({
        user_id: data.userId,
        token: data.token,
        platform: data.platform,
        device_id: data.deviceId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token'
      });

    if (error) {
      console.error("Error upserting push token:", error);
      throw new Error("Failed to store push token");
    }
  }

  /**
   * Get all push tokens for a user
   */
  async getPushTokensByUser(userId: string): Promise<PushTokenData[]> {
    const { data, error } = await this.supabase
      .from("push_tokens")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching push tokens:", error);
      throw new Error("Failed to fetch push tokens");
    }

    return (data || []).map(token => ({
      userId: token.user_id,
      token: token.token,
      platform: token.platform as 'ios' | 'android',
      deviceId: token.device_id || undefined,
    }));
  }

  /**
   * Remove a push token
   */
  async removePushToken(userId: string, token: string): Promise<void> {
    const { error } = await this.supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);

    if (error) {
      console.error("Error removing push token:", error);
      throw new Error("Failed to remove push token");
    }
  }

  /**
   * Remove all push tokens for a user
   */
  async removeAllPushTokensForUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing push tokens:", error);
      throw new Error("Failed to remove push tokens");
    }
  }
}