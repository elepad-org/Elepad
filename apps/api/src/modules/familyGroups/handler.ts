import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  AddUserWithCodeSchema,
  NewFamilyGroupSchema,
  UpdateFamilyGroupSchema,
} from "./schema";
import { FamilyGroupService } from "./service";
import { ApiException, openApiErrorResponse } from "@/utils/api-error";
import { withAuth } from "@/middleware/auth";

export const familyGroupApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    familyGroupService: FamilyGroupService;
    user: { id: string };
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
        description: "Group info with owner and members",
        content: {
          "application/json": {
            schema: z.object({
              name: z.string(),
              owner: z.object({
                id: z.string().uuid(),
                displayName: z.string(),
                avatarUrl: z.string().nullable(),
              }),
              members: z.array(
                z.object({
                  id: z.string().uuid(),
                  displayName: z.string(),
                  avatarUrl: z.string().nullable(),
                }),
              ),
            }),
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

// Apply auth middleware to the remove user endpoint
familyGroupApp.use("/familyGroup/:idGroup/member/:idUser", withAuth);

familyGroupApp.openapi(
  {
    method: "delete",
    path: "/familyGroup/{idGroup}/member/{idUser}",
    tags: ["familyGroups"],
    operationId: "removeUserFromFamilyGroup",
    request: {
      params: z.object({
        idGroup: z.uuid(),
        idUser: z.uuid(),
      }),
    },
    responses: {
      200: {
        description:
          "Member removed from group; ensures at least one group is maintained (new personal group created)",
      },
      400: openApiErrorResponse("Invalid request"),
      401: openApiErrorResponse("Unauthorized"),
      403: openApiErrorResponse(
        "You can only remove yourself from the group or be removed by the group owner",
      ),
      404: openApiErrorResponse("Group or User not found"),
      500: openApiErrorResponse("Internal Server Error"),
    },
  },
  async (c) => {
    const { idGroup, idUser } = c.req.valid("param");
    const adminUser = c.var.user;

    const result = await c.var.familyGroupService.removeUserFromFamilyGroup(
      idGroup,
      idUser,
      adminUser.id,
    );

    if (!result) {
      throw new ApiException(500, "Internal Server Error");
    }

    return c.json(result, 200);
  },
);

// Endpoint para actualizar el nombre del grupo familiar
familyGroupApp.openapi(
  {
    method: "patch",
    path: "/familyGroup/{idGroup}",
    tags: ["familyGroups"],
    request: {
      params: z.object({ idGroup: z.uuid() }),
      body: {
        content: {
          "application/json": {
            schema: UpdateFamilyGroupSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Group name updated successfully",
        content: {
          "application/json": {
            schema: z.object({
              id: z.string().uuid(),
              name: z.string(),
              ownerUserId: z.string().uuid(),
            }),
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
    const { name } = c.req.valid("json");

    const updatedGroup = await c.var.familyGroupService.updateFamilyGroupName(
      idGroup,
      name,
    );

    return c.json(updatedGroup, 200);
  },
);
