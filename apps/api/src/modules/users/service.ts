import {z} from 'zod';
import type { CreateUserInput } from "./schema";
import { usersRepo } from "./repository";

export const usersService = {
  async create(user: z.input<typeof CreateUserInput>) {
    // TODO: check for specific constrains
    return usersRepo.insert(user);
  },

  async getById(id: string) {
    return usersRepo.findById(id);
  },
  
  //async update(id: string, input: z.input<typeof UpdateUserInput>) {
  //  return usersRepo.update(id, input);
  //},
  
};
