import { usersRepo } from "./repository";
import type { z } from "zod";
import type { UpdateUserInput } from "./schema";
import { uploadProfileAvatar } from "@/services/storage";

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
  async updateWithFile(id: string, form: FormData) {
    const displayName = form.get("displayName");
    const avatarFile = form.get("avatarFile");

    const updates: { displayName?: string; avatarUrl?: string } = {};
    if (typeof displayName === "string" && displayName.trim().length > 0) {
      updates.displayName = displayName.trim();
    }

    const isFile = (v: FormDataEntryValue | null): v is File =>
      !!v && typeof v === "object" && "arrayBuffer" in v;

    if (isFile(avatarFile)) {
      const url = await uploadProfileAvatar(id, avatarFile);
      updates.avatarUrl = url;
    }

    if (!Object.keys(updates).length) {
      return usersRepo.findById(id); // nada por actualizar, devolvemos el usuario actual
    }

    return usersRepo.update(id, updates);
  },
};
