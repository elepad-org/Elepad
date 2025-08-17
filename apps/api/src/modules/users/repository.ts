import { z } from "zod";
import type { CreateUserInput } from "./schema";
import { createDatabaseClient } from "config";

const db = createDatabaseClient();

export const usersRepo = {
  async insert(user: z.input<typeof CreateUserInput>) {
    const { data, error } = await db.from("User").insert({
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      birth_date: user.birth_date,
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
    const { data, error } = await db
      .from("User")
      .select("id, fullname, username, email, birth_date")
      .eq("id", id);

    if (error || !data) {
      console.error("Error creating the user: ", error);
      return undefined;
    }
    // Remove this
    console.log(data);

    return data;
  },
};
