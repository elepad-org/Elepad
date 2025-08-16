import {z} from 'zod';
import type { CreateUserInput } from "./schema";
import { supabaseConnection } from "../../db/connection";

export const usersRepo = {
  async insert(user: z.input<typeof CreateUserInput>) {
    
    const { data, error } = await supabaseConnection.from("User").insert({
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        birth_date : user.birth_date,
        password: user.password,
      });
      if (error || !data) {
        console.error("Error creating the user: ", error);
        return undefined;
      }
      // Remove this
      console.log(data);

      return data;
  },
  async findById(id: string) {
    return supabaseConnection.from('User').select('id, fullname, username, email, birth_date').eq('id', id);
  },
  async search({ q, limit, cursor }: { q?: string; limit: number; cursor?: string }) {
    // implement keyset pagination if you like; keep repo focused on data
    // ...
  },
  async update(id: string, patch: Record<string, unknown>) {
    // build dynamic update (or use ORM)
    // ...
  },
  async softDelete(id: string) {
    // ...
  },
};
