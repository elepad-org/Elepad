import { usersRepo } from "./repository";
import type { z } from "zod";
import type { UpdateUserInput } from "./schema";

export const usersService = {
  async getById(id: string) {
    return usersRepo.findById(id);
  },

  async update(id: string, payload: z.infer<typeof UpdateUserInput>) {
    const updates: { displayName?: string; avatarUrl?: string } = {};
    if (payload.displayName !== undefined)
      updates.displayName = payload.displayName;
    if (payload.avatarUrl !== undefined) updates.avatarUrl = payload.avatarUrl;
    return usersRepo.update(id, updates);
  },
};
