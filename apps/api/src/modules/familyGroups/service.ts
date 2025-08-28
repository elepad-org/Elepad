import { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "@/utils/api-error";
import { NewFamilyGroup, AddUserWithCode } from "./schema";
import { Database } from "@/supabase-types";

export class FamilyGroupService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a Family Group for the new User.
   */
  // TODO: Could be better if this gets triggered when the user verifies the email
  async create(newGroup: NewFamilyGroup) {
    const { data, error } = await this.supabase
      .from("familyGroups")
      .insert({
        ownerUserId: newGroup.ownerUserId,
        name: `Grupo Familiar de ${newGroup.name}`,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating the family group: ", error);
      throw new ApiException(500, "Error creating the family group");
    }

    if (!data) {
      console.error("Error creating the family group");
      throw new ApiException(500, "Error creating the family group");
    }

    const userUpdate = await this.supabase
      .from("users")
      .update({
        groupId: data.id,
      })
      .eq("id", newGroup.ownerUserId);

    if (userUpdate.error) {
      console.error("Error creating the family group: ", error);
      throw new ApiException(500, "Error creating the family group");
    }

    return true;
  }

  async createInvitation(idGroup: string) {
    // Generates a random code of 6 characters (letters and numbers)
    // Not sure if this is the best approach
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // The code will expire in 10 minutes
    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();

    const { error } = await this.supabase
      .from("familyGroups")
      .update({
        code: code,
        expiresAt: expiresAt,
      })
      .eq("id", idGroup)
      //.eq("ownerUserId", idOwner) // Only the owner should create an invitation?
      .single();

    if (error) {
      console.error("Error finding the family group: ", error);
      throw new ApiException(500, "Error finding the family group");
    }

    const link = `http://elepad.com/invite/${code}`; // TODO: Change to the real URL

    return link;
  }

  async addUserToFamilyGroupWithCode(group: AddUserWithCode) {
    const dateNow = new Date();

    const { data, error } = await this.supabase
      .from("familyGroups")
      .select("id, expiresAt")
      .eq("code", group.groupCode)
      .single();

    if (error) {
      console.error("Error finding the family group: ", error);
      throw new ApiException(500, "Error finding the family group");
    }

    if (!data) {
      console.error("Couldn't find the family group");
      throw new ApiException(404, "Family Group not found");
    }

    const dateExpiresAt = new Date(data.expiresAt);
    const adjustedDate = new Date(dateExpiresAt.getTime() - 3 * 60 * 60 * 1000); // Adjusting the timezone

    if (adjustedDate < dateNow) {
      console.error("The invitation code has expired");
      throw new ApiException(400, "The invitation code has expired");
    }

    const userUpdate = await this.supabase
      .from("users")
      .update({
        groupId: data.id,
      })
      .eq("id", group.userId);

    if (userUpdate.error) {
      console.error("Error linking the user with the family group: ", error);
      throw new ApiException(
        500,
        "Error linking the user with the family group",
      );
    }

    return true;
  }
}
