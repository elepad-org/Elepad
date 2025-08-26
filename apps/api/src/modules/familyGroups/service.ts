import { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "@/utils/api-error";
import { NewFamilyGroup } from "./schema";

export class FamilyGroupService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a Family Group for the new User.
   */
  // TODO: Could be better if this gets triggered when the user verifies the email
  async create(newGroup:NewFamilyGroup) {
    const { data, error } = await this.supabase.from("familyGroups").insert({
      ownerUserId:newGroup.ownerUserId,
      name: `Grupo Familiar de ${newGroup.name}`,
    }).select('id').single();

    if (error) {
      console.error("Error creating the family group: ", error);
      throw new ApiException(500, "Error creating the family group");
    }

    if (!data) {
      console.error("Error creating the family group");
      throw new ApiException(500, "Error creating the family group");
    }

    const userUpdate = await this.supabase.from("users").update({
      groupId: data.id,
    }).eq("id", newGroup.ownerUserId);

    if (userUpdate.error) {
      console.error("Error creating the family group: ", error);
      throw new ApiException(500, "Error creating the family group");
    }
    
    return true;
  }
}
