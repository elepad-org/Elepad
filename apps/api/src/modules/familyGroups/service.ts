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
    const created = await this.createGroup(
      newGroup.ownerUserId,
      `Grupo Familiar de ${newGroup.name}`,
    );

    const userUpdate = await this.supabase
      .from("users")
      .update({
        groupId: created.id,
      })
      .eq("id", newGroup.ownerUserId);

    if (userUpdate.error) {
      console.error("Error creating the family group: ", userUpdate.error);
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

    return code;
  }

  async addUserToFamilyGroupWithCode(group: AddUserWithCode) {
    const dateNow = new Date();

    const { data, error } = await this.supabase
      .from("familyGroups")
      .select("id, expiresAt")
      .eq("code", group.invitationCode)
      .single();

    if (error) {
      console.error("Error finding the family group: ", error);
      throw new ApiException(500, "Error finding the family group");
    }

    if (!data) {
      console.error("Couldn't find the family group");
      throw new ApiException(404, "Family Group not found");
    }

    const dateExpiresAt = new Date(data.expiresAt ?? dateNow);

    if (dateExpiresAt < dateNow) {
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

  /**
   * Removes the user from the given group and ensures they are not left without a group.
   * If the user is left without a group, a personal group is automatically created
   * and assigned to them (users.groupId).
   */
  async removeUserFromFamilyGroup(
    groupId: string,
    userId: string,
  ): Promise<{
    removedFromGroupId: string;
    userId: string;
    createdNewGroup?: { id: string; name: string };
  } | null> {
    // 1) Validate that the group exists (avoid assigning an invalid groupId)
    const { data: group, error: groupErr } = await this.supabase
      .from("familyGroups")
      .select("id")
      .eq("id", groupId)
      .single();

    if (groupErr) {
      console.error("Error fetching group: ", groupErr);
      throw new ApiException(500, "Error fetching the family group");
    }
    if (!group) {
      throw new ApiException(404, "Family Group not found");
    }

    // 2) Validate that the user exists
    const { data: user, error: userErr } = await this.supabase
      .from("users")
      .select("id, groupId, displayName")
      .eq("id", userId)
      .single();

    if (userErr) {
      console.error("Error fetching user: ", userErr);
      throw new ApiException(500, "Error fetching the user");
    }
    if (!user) {
      throw new ApiException(404, "User not found");
    }

    // 3) If the user is not in that group, return a consistent 404
    if (user.groupId !== groupId) {
      throw new ApiException(404, "User is not a member of this group");
    }

    // 4) Unlink the user from the group (set groupId = null)
    const { error: unlinkErr } = await this.supabase
      .from("users")
      .update({ groupId: null })
      .eq("id", userId);
    if (unlinkErr) {
      console.error("Error unlinking user from group: ", unlinkErr);
      throw new ApiException(500, "Error unlinking the user from the group");
    }

    console.info(
      `[FamilyGroups] User ${userId} removed from group ${groupId} at ${new Date().toISOString()}`,
    );

    // 5) Validate if the user has another group assigned
    // Given the current schema (users.groupId), if it's null, they have no group.
    const created = await this.createPersonalGroupForUser(
      userId,
      user.displayName,
    );
    if (!created) {
      throw new ApiException(
        500,
        "User was removed from the group but failed to create a personal group",
      );
    }

    // Assign the new groupId to the user
    const { error: reassignErr } = await this.supabase
      .from("users")
      .update({ groupId: created.id })
      .eq("id", userId);
    if (reassignErr) {
      console.error(
        "Error assigning new personal group to user: ",
        reassignErr,
      );
      throw new ApiException(500, "Error assigning new personal group to user");
    }

    console.info(
      `[FamilyGroups] Created personal group ${created.id} ("${created.name}") for user ${userId} and reassigned at ${new Date().toISOString()}`,
    );

    return {
      removedFromGroupId: groupId,
      userId,
      createdNewGroup: { id: created.id, name: created.name },
    };
  }

  /**
   * Creates a personal group in familyGroups and returns { id, name }.
   */
  private async createPersonalGroupForUser(
    userId: string,
    displayName?: string,
  ): Promise<{ id: string; name: string } | null> {
    const name = `Grupo Familiar de ${displayName ?? "Usuario"}`;
    try {
      const data = await this.createGroup(userId, name);
      return data;
    } catch (e) {
      console.error("Error creating personal family group: ", e);
      return null;
    }
  }

  /**
   * Creates a group in familyGroups and returns its id and name.
   * Reusable internal method with no side effects on users.
   */
  private async createGroup(
    ownerUserId: string,
    name: string,
  ): Promise<{ id: string; name: string }> {
    const { data, error } = await this.supabase
      .from("familyGroups")
      .insert({ ownerUserId, name })
      .select("id, name")
      .single();

    if (error || !data) {
      console.error("Error creating the family group: ", error);
      throw new ApiException(500, "Error creating the family group");
    }

    return data;
  }
}
