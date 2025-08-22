import { usersRepo } from "./repository";

export const usersService = {
  async getById(id: string) {
    return usersRepo.findById(id);
  },
};
