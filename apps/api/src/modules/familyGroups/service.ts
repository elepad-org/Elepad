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

  async addUserToFamilyGroupWithCode(group: AddUserWithCode) {
    const { data, error } = await this.supabase
      .from("familyGroups")
      .select("id")
      .eq("code", group.groupCode)
      .single();

    if (error) {
      console.error("Error finding the family group: ", error);
      throw new ApiException(500, "Error finding the family group");
    }

    if (!data) {
      console.error("Error finding the family group");
      throw new ApiException(404, "Error finding the family group");
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
