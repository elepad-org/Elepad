import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = "https://sdnmoweppzszpxyggdyg.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? '';

export const supabaseConnection = createClient(supabaseUrl, supabaseKey);