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
   * Get group info: name, owner and members list (id, displayName, avatarUrl).
   */
  async getMembers(idGroup: string): Promise<{
    name: string;
    owner: { id: string; displayName: string; avatarUrl: string | null; elder: boolean };
    members: Array<{
      id: string;
      displayName: string;
      avatarUrl: string | null;
      elder: boolean;
    }>;
  }> {
    // Traer grupo (para obtener name y ownerUserId)
    const { data: group, error: groupErr } = await this.supabase
      .from("familyGroups")
      .select("name, ownerUserId")
      .eq("id", idGroup)
      .single();

    if (groupErr || !group) {
      console.error("Error fetching family group: ", groupErr);
      throw new ApiException(404, "Group not found");
    }

    // Traer miembros del grupo
    const { data: members, error: membersErr } = await this.supabase
      .from("users")
      .select("id, displayName, avatarUrl, elder")
      .eq("groupId", idGroup);

    if (membersErr) {
      console.error("Error fetching family group members: ", membersErr);
      throw new ApiException(500, "Error fetching family group members");
    }

    const membersList = members ?? [];
    const filteredMembers = membersList.filter(
      (u) => u.id !== group.ownerUserId,
    );

    // Obtener el owner a partir de ownerUserId
    const ownerItem = membersList.find((u) => u.id === group.ownerUserId);
    if (!ownerItem) {
      // Si por algún motivo el owner no figura en la lista (inconsistencia), intentar consultarlo directo
      const { data: ownerUser, error: ownerErr } = await this.supabase
        .from("users")
        .select("id, displayName, avatarUrl, elder")
        .eq("id", group.ownerUserId)
        .single();
      if (ownerErr || !ownerUser) {
        console.error("Owner not found in users: ", ownerErr);
        throw new ApiException(404, "Group owner not found");
      }
      return {
        name: group.name,
        owner: ownerUser,
        members: filteredMembers,
      };
    }

    return {
      name: group.name,
      owner: ownerItem,
      members: filteredMembers,
    };
  }

  async updateFamilyGroupName(groupId: string, newName: string) {
    const { data, error } = await this.supabase
      .from("familyGroups")
      .update({ name: newName })
      .eq("id", groupId)
      .select()
      .single();

    if (error) {
      console.error("Error updating family group name:", error);
      throw new ApiException(500, "Error updating family group name");
    }

    if (!data) {
      throw new ApiException(404, "Family group not found");
    }

    return data;
  }

  async transferOwnership(
    groupId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ) {
    // 1) Validate that the group exists and get current owner info
    const { data: group, error: groupErr } = await this.supabase
      .from("familyGroups")
      .select("id, name, ownerUserId")
      .eq("id", groupId)
      .single();

    if (groupErr) {
      console.error("Error fetching family group:", groupErr);
      throw new ApiException(500, "Error fetching the family group");
    }

    if (!group) {
      throw new ApiException(404, "Family group not found");
    }

    // 2) Validate that the current user is the owner
    if (group.ownerUserId !== currentOwnerId) {
      throw new ApiException(
        403,
        "Only the current group owner can transfer ownership",
      );
    }

    // 3) Validate that it's not the same owner
    if (currentOwnerId === newOwnerId) {
      throw new ApiException(400, "Cannot transfer ownership to the same user");
    }

    // 4) Validate that the new owner exists and is a member of the group
    const { data: newOwner, error: newOwnerErr } = await this.supabase
      .from("users")
      .select("id, groupId, displayName")
      .eq("id", newOwnerId)
      .single();

    if (newOwnerErr) {
      console.error("Error fetching new owner:", newOwnerErr);
      throw new ApiException(500, "Error validating new owner");
    }

    if (!newOwner) {
      throw new ApiException(404, "New owner user not found");
    }

    if (newOwner.groupId !== groupId) {
      throw new ApiException(400, "New owner must be a member of the group");
    }

    // 5) Transfer ownership
    const { data, error } = await this.supabase
      .from("familyGroups")
      .update({ ownerUserId: newOwnerId })
      .eq("id", groupId)
      .select("id, name, ownerUserId, createdAt")
      .single();

    if (error) {
      console.error("Error transferring ownership:", error);
      throw new ApiException(500, "Error transferring ownership");
    }

    if (!data) {
      throw new ApiException(500, "Failed to transfer ownership");
    }

    console.info(
      `[FamilyGroups] Ownership of group ${groupId} transferred from ${currentOwnerId} to ${newOwnerId} at ${new Date().toISOString()}`,
    );

    return {
      group: data,
      previousOwner: { id: currentOwnerId },
      newOwner: { id: newOwnerId, displayName: newOwner.displayName },
    };
  }

  async removeUserFromFamilyGroup(
    groupId: string,
    userId: string,
    adminUserId: string,
    createNewGroup: boolean = true,
  ): Promise<{
    removedFromGroupId: string;
    userId: string;
    createdNewGroup?: { id: string; name: string };
  } | null> {
    // 1) Validate that the group exists and get owner info (avoid assigning an invalid groupId)
    const { data: group, error: groupErr } = await this.supabase
      .from("familyGroups")
      .select("id, ownerUserId")
      .eq("id", groupId)
      .single();

    if (groupErr) {
      console.error("Error fetching group: ", groupErr);
      throw new ApiException(500, "Error fetching the family group");
    }
    if (!group) {
      throw new ApiException(404, "Family Group not found");
    }

    // 2) Authorization check: Owner can remove anyone, members can only remove themselves
    const isOwner = group.ownerUserId === adminUserId;
    const isSelfRemoval = userId === adminUserId;

    if (!isOwner && !isSelfRemoval) {
      throw new ApiException(
        403,
        "You can only remove yourself from the group or be removed by the group owner",
      );
    }

    // 3) Validate that the user exists
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

    // 4) If the user is not in that group, return a consistent 404
    if (user.groupId !== groupId) {
      throw new ApiException(404, "User is not a member of this group");
    }

    // 5) Prevent the owner from removing themselves if there are other members in the group
    if (userId === group.ownerUserId && isSelfRemoval) {
      // Check if there are other members in the group
      const { data: otherMembers, error: membersErr } = await this.supabase
        .from("users")
        .select("id")
        .eq("groupId", groupId)
        .neq("id", userId);

      if (membersErr) {
        console.error("Error checking other members: ", membersErr);
        throw new ApiException(500, "Error checking group members");
      }

      // If there are other members, the owner cannot leave
      if (otherMembers && otherMembers.length > 0) {
        throw new ApiException(
          400,
          "Group owner cannot leave the group while there are other members. Transfer ownership first.",
        );
      }
    }

    // 6) Unlink the user from the group (set groupId = null)
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

    // 7) Solo crear un nuevo grupo si se solicita
    if (!createNewGroup) {
      console.info(
        `[FamilyGroups] User ${userId} left group without creating a new one at ${new Date().toISOString()}`,
      );
      return {
        removedFromGroupId: groupId,
        userId,
      };
    }

    // 8) Validate if the user has another group assigned
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

  /**
   * Verifica si un usuario puede acceder a los datos de otro usuario
   * Esto es true si:
   * 1. Es el mismo usuario
   * 2. Ambos están en el mismo grupo familiar Y el usuario actual NO es elder
   */
  async canAccessUserData(currentUserId: string, targetUserId: string): Promise<boolean> {
    // Si es el mismo usuario, siempre puede acceder
    if (currentUserId === targetUserId) {
      return true;
    }

    try {
      // Obtener información de ambos usuarios
      const { data: users, error } = await this.supabase
        .from("users")
        .select("id, groupId, elder")
        .in("id", [currentUserId, targetUserId]);

      if (error || !users || users.length !== 2) {
        return false;
      }

      const currentUser = users.find(u => u.id === currentUserId);
      const targetUser = users.find(u => u.id === targetUserId);

      if (!currentUser || !targetUser) {
        return false;
      }

      // Deben estar en el mismo grupo familiar
      if (!currentUser.groupId || currentUser.groupId !== targetUser.groupId) {
        return false;
      }

      // El usuario actual NO debe ser elder (los elders no pueden ver datos de otros)
      // Solo los helpers/supervisores pueden ver datos de los elders
      if (currentUser.elder === true) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return false;
    }
  }
}
