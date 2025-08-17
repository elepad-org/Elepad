import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  env: process.env.NODE_ENV ?? "development",
  supabaseUrl: process.env.SUPABASE_URL ?? "http://localhost:54321",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
};

export const createSupabaseClient = () => {
  return createClient(config.supabaseUrl, config.supabaseSecretKey);
};
