import { z } from "@hono/zod-openapi";

// Enums (Mirrored from DB)
export const ShopItemTypeEnum = z.enum([
  "sticker",
  "frame",
  "animation",
  "other",
]);
export const TransactionSourceEnum = z.enum([
  "game_reward",
  "achievement",
  "purchase",
  "admin_adjustment",
]);

// Base Entity Schemas
export const ShopItemSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    cost: z.number().int().min(0),
    type: ShopItemTypeEnum,
    assetUrl: z.string().nullable(),
    isActive: z.boolean().default(true),
    createdAt: z.string(),
  })
  .openapi("ShopItem");

export const UserInventorySchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    itemId: z.string().uuid(),
    equipped: z.boolean().default(false),
    acquiredAt: z.string(),
    // Include joined item details for convenience
    item: ShopItemSchema.optional(),
  })
  .openapi("UserInventory");

export const PointTransactionSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    amount: z.number().int(),
    source: TransactionSourceEnum,
    referenceId: z.string().uuid().nullable(),
    createdAt: z.string(),
  })
  .openapi("PointTransaction");

// API Request/Response Schemas
export const BuyItemRequestSchema = z
  .object({
    itemId: z.string().uuid(),
    recipientUserId: z.string().uuid().optional(), // Para comprar para otra persona
  })
  .openapi("BuyItemRequest");

export const BuyItemResponseSchema = z
  .object({
    success: z.boolean(),
    newBalance: z.number().int(),
    inventoryItem: UserInventorySchema,
  })
  .openapi("BuyItemResponse");

// Used for fetching user balance quickly
export const UserBalanceSchema = z
  .object({
    pointsBalance: z.number().int(),
  })
  .openapi("UserBalance");

export const EquipItemRequestSchema = z
  .object({
    itemId: z.string().uuid(),
  })
  .openapi("EquipItemRequest");

export const EquipItemResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi("EquipItemResponse");

export const ItemOwnershipSchema = z
  .object({
    itemId: z.string().uuid(),
    ownerUserIds: z.array(z.string().uuid()),
  })
  .openapi("ItemOwnership");

export const UnequipItemRequestSchema = z
  .object({
    itemType: ShopItemTypeEnum.optional().default("frame"), // Support specifying the type
  })
  .openapi("UnequipItemRequest");

export const UnequipItemResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi("UnequipItemResponse");
