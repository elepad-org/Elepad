import { z } from "@hono/zod-openapi";

export const FamilyGroupSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    ownerUserId: z.uuid(),
    createdAt: z.date(), // TODO: Check how the date is represented
    code: z.string().optional(),
    expiresAt: z.date().optional(),
  })
  .openapi("FamilyGroup");

export type FamilyGroup = z.infer<typeof FamilyGroupSchema>;

export const NewFamilyGroupSchema = z
  .object({
    name: z.string().min(1),
    ownerUserId: z.uuid(),
  })
  .openapi("NewFamilyGroup");

export type NewFamilyGroup = z.infer<typeof NewFamilyGroupSchema>;

export const UpdateFamilyGroupSchema = z
  .object({
    name: z.string().min(1),
  })
  .strict()
  .openapi("UpdateFamilyGroup");

export type UpdateUser = z.infer<typeof UpdateFamilyGroupSchema>;

export const AddUserWithCodeSchema = z
  .object({
    userId: z.uuid(),
    invitationCode: z.string().min(1),
  })
  .openapi("AddUserWithCode");

export type AddUserWithCode = z.infer<typeof AddUserWithCodeSchema>;

export const TransferOwnershipSchema = z
  .object({
    newOwnerId: z.uuid(),
  })
  .strict()
  .openapi("TransferOwnership");

export type TransferOwnership = z.infer<typeof TransferOwnershipSchema>;
