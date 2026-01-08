import { ApiException } from "@/utils/api-error";
import type { UpdateUser } from "./schema";
import { uploadUserAvatarImage as uploadUserAvatar } from "@/services/storage";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";

/**
 * Service class to handle user-related operations.
 * While more complex applications might use a repository layer to separate data access logic,
 * elepad services will connect directly to Supabase to avoid having anemic services.
 */
export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a user by their ID.
   */
  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, email, displayName, avatarUrl, groupId, elder")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error finding the user: ", error);
      throw new ApiException(500, "Error finding the user");
    }
    if (!data) {
      throw new ApiException(404, "User not found");
    }
    return data;
  }

  /**
   * Update a user's information (except their avatar).
   */
  async update(id: string, payload: UpdateUser) {
    const updates: { displayName?: string; avatarUrl?: string } = {};

    if (payload.displayName !== undefined) {
      updates.displayName = payload.displayName;
    }

    if (payload.avatarUrl !== undefined) {
      updates.avatarUrl = payload.avatarUrl;
    }

    const { data, error } = await this.supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, displayName, avatarUrl, groupId, elder")
      .maybeSingle();

    if (error) {
      console.error("Error updating the user: ", error);
      throw new ApiException(500, "Error updating the user");
    }

    return data ?? undefined;
  }

  /**
   * Verify if a FormDataEntryValue is a File (as opposed to a string).
   */
  isFile(value: FormDataEntryValue | null): value is File {
    return !!value && typeof value === "object" && "arrayBuffer" in value;
  }

  /**
   * Update ONLY the user's avatar.
   */
  async updateUserAvatar(id: string, form: FormData) {
    const avatarFile = form.get("avatarFile");
    console.log(JSON.stringify(avatarFile, null, 2));
    console.log(avatarFile instanceof File);

    if (!this.isFile(avatarFile)) {
      throw new ApiException(400, "Invalid or missing avatar file");
    }

    const avatarUrl = await uploadUserAvatar(this.supabase, id, avatarFile);

    // Updating the avatar image implies updating the avatar url.
    return this.update(id, { avatarUrl });
  }
}
