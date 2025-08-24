// import { z } from "zod";
// import type { CreateUserInput } from "./schema";
import { createSupabaseClient } from "@/config";

const db = createSupabaseClient();

export const usersRepo = {
  // De momento no usamos este insert, la alta de usuarios la gestiona Supabase
  // async insert(user: z.input<typeof CreateUserInput>) {
  //   const { data, error } = await db.from("User").insert({
  //     username: user.username,
  //     email: user.email,
  //     fullname: user.fullname,
  //     birth_date: user.birth_date,
  //     password: user.password,
  //   });
  //   if (error || !data) {
  //     console.error("Error creating the user: ", error);
  //     return undefined;
  //   }
  //   return data;
  // },
  async findById(id: string) {
    const { data, error } = await db
      .from("users")
      .select("id, email, displayName, avatarUrl, groupId")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error finding the user: ", error);
      throw new Error(error.message);
    }
    if (!data) {
      return undefined; // Not found
    }
    return data;
  },
};
