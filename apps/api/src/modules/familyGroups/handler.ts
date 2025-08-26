import { OpenAPIHono, z } from "@hono/zod-openapi";
import { FamilyGroupSchema, NewFamilyGroupSchema } from "./schema";
import { FamilyGroupService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";

export const familyGroupApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    familyGroupService: FamilyGroupService;
  }
}

familyGroupApp.use("*", async (c, next) => {
  const familyGroupService = new FamilyGroupService(c.var.supabase);
  c.set("familyGroupService", familyGroupService);
  await next();
});

familyGroupApp.openapi(
  {
    method: "post",
    path: "/familyGroup/create",
    tags: ["familyGroups"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewFamilyGroupSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Created group",
      },
      400: openApiErrorResponse("Invalid request"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");

    const created = await c.var.familyGroupService.create(body);
    if (!created) {
      throw new ApiException(500, "Internal Server Error");
    }

    return c.json(created, 201);
  }
);
