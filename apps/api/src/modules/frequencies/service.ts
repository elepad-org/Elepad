import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { ApiException } from "@/utils/api-error";
import { NewFrequency } from "./schema";

export class FrequencyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAll() {
    const { data, error } = await this.supabase
      .from("frequencies")
      .select("*")
      .order("label");

    if (error) {
      throw new ApiException(500, "Error al obtener las frecuencias", error);
    }

    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from("frequencies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiException(500, "Error al obtener la frecuencia", error);
    }

    if (!data) {
      throw new ApiException(404, "Frecuencia no encontrada");
    }

    return data;
  }

  async create(payload: NewFrequency) {
    const { data, error } = await this.supabase
      .from("frequencies")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new ApiException(500, "Error al crear la frecuencia", error);
    }

    return data;
  }
}
