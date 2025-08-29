import { OpenAPIHono, z } from "@hono/zod-openapi";
import { AddUserWithCodeSchema, NewFamilyGroupSchema } from "./schema";
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
  },
);

familyGroupApp.openapi(
  {
    method: "post",
    path: "/familyGroup/link",
    tags: ["familyGroups"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: AddUserWithCodeSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "User added to group successfully",
      },
      400: openApiErrorResponse("Invalid request"),
      404: openApiErrorResponse("Group or User not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const body = c.req.valid("json");
    const linked =
      await c.var.familyGroupService.addUserToFamilyGroupWithCode(body);
    if (!linked) {
      throw new ApiException(500, "Internal Server Error");
    }

    return c.json(linked, 200);
  },
);

familyGroupApp.openapi(
  {
    method: "get",
    path: "/familyGroup/{idGroup}/invite",
    tags: ["familyGroups"],
    request: {
      params: z.object({ idGroup: z.uuid() }),
    },
    responses: {
      200: {
        description: "Invitation code created successfully",
      },
      400: openApiErrorResponse("Invalid request"),
      404: openApiErrorResponse("Group not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { idGroup } = c.req.valid("param");
    const invitationCode =
      await c.var.familyGroupService.createInvitation(idGroup);
    if (!invitationCode) {
      throw new ApiException(500, "Internal Server Error");
    }

    return c.json(invitationCode, 200);
  },
);

familyGroupApp.openapi(
  {
    method: "get",
    path: "/familyGroup/{idGroup}/members",
    tags: ["familyGroups"],
    request: {
      params: z.object({ idGroup: z.uuid() }),
    },
    responses: {
      200: {
        description: "List of members",
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string().uuid(),
                displayName: z.string(),
                avatarUrl: z.string().nullable(),
              }),
            ),
          },
        },
      },
      400: openApiErrorResponse("Invalid request"),
      404: openApiErrorResponse("Group not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { idGroup } = c.req.valid("param");
    const members = await c.var.familyGroupService.getMembers(idGroup);
    return c.json(members, 200);
  },
);
