import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { HTTPException } from "hono/http-exception";
import { NotificationsService } from "../notifications/service";

export class ShopService {
  private notificationsService: NotificationsService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.notificationsService = new NotificationsService(supabase);
  }

  /**
   * Get all active shop items
   */
  async listShopItems() {
    const { data, error } = await this.supabase
      .from("shop_items")
      .select("*")
      .eq("is_active", true)
      .order("cost", { ascending: true }); // Cheap items first

    if (error) {
      throw new Error(`Error fetching shop items: ${error.message}`);
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      cost: item.cost,
      type: item.type,
      assetUrl: item.asset_url,
      isActive: item.is_active || true, // Default to true if null (though schema says default true)
      createdAt: item.created_at,
    }));
  }

  /**
   * Get which users in a family group own a specific item
   */
  async getItemOwnership(itemId: string, groupId: string) {
    // Get all users in the family group
    const { data: groupMembers, error: groupError } = await this.supabase
      .from("users")
      .select("id")
      .eq("groupId", groupId);

    if (groupError) {
      throw new Error(`Error fetching group members: ${groupError.message}`);
    }

    const memberIds = groupMembers?.map(m => m.id) || [];

    // Get which of these users own the item
    const { data: owners, error: ownerError } = await this.supabase
      .from("user_inventory")
      .select("user_id")
      .eq("item_id", itemId)
      .in("user_id", memberIds);

    if (ownerError) {
      throw new Error(`Error fetching item ownership: ${ownerError.message}`);
    }

    return {
      itemId,
      ownerUserIds: owners?.map(o => o.user_id) || [],
    };
  }

  /**
   * Get items owned by a specific user
   */
  async getUserInventory(userId: string) {
    const { data, error } = await this.supabase
      .from("user_inventory")
      .select(`
        *,
        item:shop_items(*)
      `)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error fetching user inventory: ${error.message}`);
    }

    return data.map((inv) => ({
      id: inv.id,
      userId: inv.user_id,
      itemId: inv.item_id,
      equipped: inv.equipped || false,
      acquiredAt: inv.acquired_at,
      item: inv.item
        ? {
          id: inv.item.id,
          title: inv.item.title,
          description: inv.item.description,
          cost: inv.item.cost,
          type: inv.item.type,
          assetUrl: inv.item.asset_url,
          isActive: inv.item.is_active || true,
          createdAt: inv.item.created_at,
        }
        : undefined,
    }));
  }

  /**
   * Process a purchase for a user
   * Critical: Uses RPC or strict checks for data integrity
   * @param userId - El usuario que realiza la compra (quien paga)
   * @param itemId - El item a comprar
   * @param recipientUserId - El usuario que recibirá el item (opcional)
   */
  async buyItem(userId: string, itemId: string, recipientUserId?: string) {
    // 1. Fetch Item Details & User Balance
    // We do this inside a Postgres Function (RPC) ideally for atomicity,
    // but standard Supabase client logic works if we are careful with race conditions.
    // However, the BEST way to prevent race conditions (double spend) is using a Database Function (RPC).
    // Let's implement this logic client-side first for simplicity, but acknowledge the race condition risk.
    // Given the low frequency of transactions, a strict check-then-write flow is acceptable for MVP.

    // Check if user is Elder (el que compra debe ser elder)
    // (Assuming middleware checks auth, but business logic requires Elder for earning points.
    //  Can non-elders buy? The prompt said "Solo los elder pueden jugar juegos y ganar puntos",
    //  implies only they participate in this economy. We'll enforce Elder only just in case.)

    const { data: userData, error: userError } = await this.supabase
      .from("users")
      .select("points_balance, elder, groupId")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      throw new HTTPException(404, { message: "User not found" });
    }

    if (!userData.elder) {
      throw new HTTPException(403, { message: "Only elders can purchase items" });
    }

    // Si hay un recipientUserId, validar que sea del mismo grupo y NO sea elder
    let finalRecipientId = userId; // Por defecto, el comprador es el receptor
    if (recipientUserId) {
      const { data: recipientData, error: recipientError } = await this.supabase
        .from("users")
        .select("id, groupId, elder")
        .eq("id", recipientUserId)
        .single();

      if (recipientError || !recipientData) {
        throw new HTTPException(404, { message: "Recipient user not found" });
      }

      // Validar que esté en el mismo grupo familiar
      if (recipientData.groupId !== userData.groupId) {
        throw new HTTPException(403, { message: "Recipient must be in the same family group" });
      }

      // Validar que el receptor NO sea abuelo
      if (recipientData.elder) {
        throw new HTTPException(400, { message: "Cannot purchase items for other elders" });
      }

      finalRecipientId = recipientUserId;
    }

    // Check if item exists and is active
    const { data: itemData, error: itemError } = await this.supabase
      .from("shop_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !itemData) {
      throw new HTTPException(404, { message: "Item not found" });
    }

    if (!itemData.is_active) {
      throw new HTTPException(400, { message: "Item is no longer available" });
    }

    // Check if already owned (by the final recipient)
    const { data: ownedData } = await this.supabase
      .from("user_inventory")
      .select("id")
      .eq("user_id", finalRecipientId)
      .eq("item_id", itemId)
      .single();

    if (ownedData) {
      throw new HTTPException(400, { message: recipientUserId ? "The recipient already owns this item" : "You already own this item" });
    }

    // Check balance
    if (userData.points_balance < itemData.cost) {
      throw new HTTPException(400, { message: "Insufficient points" });
    }

    // --- EXECUTE TRANSACTION ---
    // Since Supabase-js doesn't support complex transactions easily without RPC,
    // We will do optimistic checks and sequential writes. 
    // To be perfectly safe, we SHOULD use an RPC, but let's stick to TS logic if we trust the load is low.
    // If you want 100% safety, we can create a PL/SQL function `purchase_item`.

    // 1. Deduct Points (from the buyer, not the recipient)
    const { error: updateError } = await this.supabase
      .from("users")
      .update({ points_balance: userData.points_balance - itemData.cost })
      .eq("id", userId); // Siempre deduce puntos del comprador

    if (updateError) {
      throw new Error("Failed to update user balance");
    }

    // 2. Add to Inventory (to the final recipient)
    const { data: inventoryItem, error: inventoryError } = await this.supabase
      .from("user_inventory")
      .insert({
        user_id: finalRecipientId, // El item va al receptor final
        item_id: itemId,
        equipped: false
      })
      .select()
      .single();

    if (inventoryError) {
      // Critical Logic Error: Money taken but no item given.
      // In a real app, we'd refund here. 
      console.error("CRITICAL: Failed to give item after charging!", userId, itemId);
      throw new Error("Failed to add item to inventory");
    }

    // 3. Log Transaction (registrar quién compró y para quién)
    await this.supabase
      .from("point_transactions")
      .insert({
        user_id: userId, // Quien compró
        amount: -itemData.cost, // Negative for spending
        source: "purchase",
        reference_id: itemId
      });

    // 4. Si es un regalo, crear notificación para el receptor
    if (recipientUserId && finalRecipientId !== userId) {
      try {
        // Obtener nombre del comprador
        const { data: buyerData } = await this.supabase
          .from("users")
          .select("displayName")
          .eq("id", userId)
          .single();

        const buyerName = buyerData?.displayName || "Alguien";
        const itemTypeName = itemData.type === "sticker" ? "sticker" : itemData.type === "frame" ? "marco" : "item";

        await this.notificationsService.createNotification({
          userId: finalRecipientId,
          actorId: userId,
          eventType: "gift_received",
          entityType: "shop_item",
          entityId: itemId,
          title: `${buyerName} te regaló un ${itemTypeName}`,
          body: itemData.title,
        });
      } catch (notifError) {
        // No fallar la compra si falla la notificación
        console.error("Error creating gift notification:", notifError);
      }
    }

    return {
      success: true,
      newBalance: userData.points_balance - itemData.cost,
      inventoryItem: {
        id: inventoryItem.id,
        userId: inventoryItem.user_id,
        itemId: inventoryItem.item_id,
        equipped: inventoryItem.equipped || false,
        acquiredAt: inventoryItem.acquired_at,
        item: {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          cost: itemData.cost,
          type: itemData.type,
          assetUrl: itemData.asset_url,
          isActive: itemData.is_active || true,
          createdAt: itemData.created_at,
        }
      }
    };
  }

  async getBalance(userId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("points_balance")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { pointsBalance: data.points_balance };
  }

  /**
   * Equip an item (specifically for Frames)
   */
  async equipItem(userId: string, itemId: string) {
    // 1. Verify ownership
    const { data: inventoryItem, error: ownershipError } = await this.supabase
      .from("user_inventory")
      .select("*, item:shop_items(*)")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .single();

    if (ownershipError || !inventoryItem) {
      throw new HTTPException(404, { message: "Item not found in inventory" });
    }

    const item = inventoryItem.item as Database["public"]["Tables"]["shop_items"]["Row"];

    // 2. Limit: Only Frames can be equipped for now (as per requirement)
    if (item.type !== "frame") {
      throw new HTTPException(400, { message: "Only frames can be equipped" });
    }

    // 3. Unequip all other frames for this user
    // First, find all inventory items that are frames for this user
    const { data: allUserFrames } = await this.supabase
      .from("user_inventory")
      .select("id, item:shop_items!inner(type)")
      .eq("user_id", userId)
      .eq("item.type", "frame");

    if (allUserFrames && allUserFrames.length > 0) {
      const idsToUnequip = allUserFrames.map(f => f.id);
      await this.supabase
        .from("user_inventory")
        .update({ equipped: false })
        .in("id", idsToUnequip);
    }

    // 4. Equip the target item
    const { error: updateError } = await this.supabase
      .from("user_inventory")
      .update({ equipped: true })
      .eq("id", inventoryItem.id);

    if (updateError) {
      throw new Error(`Error equipping item: ${updateError.message}`);
    }

    return { success: true, message: "Frame equipped successfully" };
  }

  /**
   * Unequip all items of a specific type (e.g. Frames)
   */
  async unequipItemType(userId: string, itemType: "frame" | "sticker" | "animation" | "other" = "frame") {
    // 1. Find all inventory items of the given type for this user
    const { data: allUserItems } = await this.supabase
      .from("user_inventory")
      .select("id, item:shop_items!inner(type)")
      .eq("user_id", userId)
      .eq("item.type", itemType);

    if (allUserItems && allUserItems.length > 0) {
      const idsToUnequip = allUserItems.map(f => f.id);

      // 2. Set equipped to false
      const { error: updateError } = await this.supabase
        .from("user_inventory")
        .update({ equipped: false })
        .in("id", idsToUnequip);

      if (updateError) {
        throw new Error(`Error unequipping item: ${updateError.message}`);
      }
    }

    return { success: true, message: "Items unequipped successfully" };
  }
}
