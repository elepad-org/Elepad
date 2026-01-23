import { OpenAPIHono, z } from "@hono/zod-openapi";
import { ShopService } from "./service";
import {
  ShopItemSchema,
  UserInventorySchema,
  BuyItemRequestSchema,
  BuyItemResponseSchema,
  UserBalanceSchema,
  EquipItemRequestSchema,
  EquipItemResponseSchema,
} from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const shopApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    shopService: ShopService;
  }
}

shopApp.use("/shop/*", async (c, next) => {
  const shopService = new ShopService(c.var.supabase);
  c.set("shopService", shopService);
  await next();
});

// 1. List All Activ Shop Items
shopApp.openapi(
  {
    method: "get",
    path: "/shop/items",
    tags: ["shop"],
    summary: "List available shop items",
    responses: {
      200: {
        description: "List of active items in the shop",
        content: {
          "application/json": {
            schema: z.array(ShopItemSchema),
          },
        },
      },
      500: openApiErrorResponse("Internal server error"),
    },
  },
  async (c) => {
    const items = await c.var.shopService.listShopItems();
    return c.json(items, 200);
  }
);

// 2. Get User Inventory
shopApp.openapi(
  {
    method: "get",
    path: "/shop/inventory",
    tags: ["shop"],
    summary: "Get current user's inventory",
    responses: {
      200: {
        description: "List of items owned by the user",
        content: {
          "application/json": {
            schema: z.array(UserInventorySchema),
          },
        },
      },
      500: openApiErrorResponse("Internal server error"),
    },
  },
  async (c) => {
    const userId = c.var.user.id;
    const inventory = await c.var.shopService.getUserInventory(userId);
    return c.json(inventory, 200);
  }
);

// 3. Buy Item
shopApp.openapi(
  {
    method: "post",
    path: "/shop/buy",
    tags: ["shop"],
    summary: "Purchase an item",
    request: {
      body: {
        content: {
          "application/json": {
            schema: BuyItemRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Purchase successful",
        content: {
          "application/json": {
            schema: BuyItemResponseSchema,
          },
        },
      },
      400: openApiErrorResponse("Insufficient funds or already owned"),
      403: openApiErrorResponse("Only elders can purchase"),
      404: openApiErrorResponse("Item not found"),
      500: openApiErrorResponse("Internal server error"),
    },
  },
  async (c) => {
    const { itemId } = c.req.valid("json");
    const userId = c.var.user.id;
    
    try {
        const result = await c.var.shopService.buyItem(userId, itemId);
        return c.json(result, 200);
    } catch (e: unknown) {
        // If service threw an HTTPException, we could rethrow or handle here.
        // Hono catches HTTPExceptions automatically, so regular errors need mapping.
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage === "Insufficient points" || errorMessage === "You already own this item") {
             return c.json({ error: { message: errorMessage } }, 400);
        }
        throw e;
    }
  }
);

// 4. Get Balance (Convenience)
shopApp.openapi(
    {
      method: "get",
      path: "/shop/balance",
      tags: ["shop"],
      summary: "Get user point balance",
      responses: {
        200: {
          description: "User current points balance",
          content: {
            "application/json": {
              schema: UserBalanceSchema,
            },
          },
        },
        500: openApiErrorResponse("Internal server error"),
      },
    },
    async (c) => {
      const userId = c.var.user.id;
      const balance = await c.var.shopService.getBalance(userId);
      return c.json(balance, 200);
    }
  );

// 5. Equip Item
shopApp.openapi(
  {
    method: "post",
    path: "/shop/equip",
    tags: ["shop"],
    summary: "Equip an item (e.g. Frame)",
    request: {
      body: {
        content: {
          "application/json": {
            schema: EquipItemRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Item equipped successfully",
        content: {
          "application/json": {
            schema: EquipItemResponseSchema,
          },
        },
      },
      400: openApiErrorResponse("Invalid item type or request"),
      404: openApiErrorResponse("Item not found"),
      500: openApiErrorResponse("Internal server error"),
    },
  },
  async (c) => {
    const { itemId } = c.req.valid("json");
    const userId = c.var.user.id;

    try {
      const result = await c.var.shopService.equipItem(userId, itemId);
      return c.json(result, 200);
    } catch (e: unknown) {
        // Hono catches HTTPExceptions automatically. For others, map them.
        const errorMessage = e instanceof Error ? e.message : String(e);
        return c.json({ error: { message: errorMessage } }, 400);
    }
  }
);
