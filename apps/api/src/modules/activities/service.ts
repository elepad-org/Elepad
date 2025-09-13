import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { NewActivity, UpdateActivity } from "./schema";

export class ActivityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new ApiException(500, "Error al obtener la Actividad", error);
    }
    if (!data) {
      throw new ApiException(404, "Actividad no encontrada");
    }
    return data;
  }

  // TODO: Check if the user id exist
  async getByUserId(idCreator: string) {
    const { data, error } = await this.supabase
      .from("activities")
      .select("*")
      .eq("createdBy", idCreator);
    if (error) {
      throw new ApiException(500, "Error al obtener la actividad", error);
    }
    if (!data) {
      throw new ApiException(404, "Actividad no encontrada");
    }
    return data;
  }

  async create(payload: NewActivity) {
    const { data, error } = await this.supabase
      .from("activities")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      throw new ApiException(500, "Error al crear la actividad", error);
    }
    return data;
  }

  async update(id: string, payload: UpdateActivity) {
    const { data, error } = await this.supabase
      .from("activities")
      .update({ ...payload })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      throw new ApiException(500, "Error al actualizar la actividad", error);
    }
    if (!data) {
      throw new ApiException(404, "Actividad no encontrada");
    }
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from("activities")
      .delete()
      .eq("id", id);
    if (error) {
      throw new ApiException(500, "Error al eliminar la actividad", error);
    }
    return true;
  }
}
