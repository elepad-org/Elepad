import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { NewActivity, UpdateActivity } from "./schema";

export class ActivityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getActivityById(id: string) {
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
  async getActivitiesWithFamilyCode(idFamilyGroup: string) {
    // Obtener los IDs de los usuarios del grupo familiar
    const { data: usersIds, error: usersError } = await this.supabase
      .from("users")
      .select("id")
      .eq("groupId", idFamilyGroup);

    if (usersError) {
      throw new ApiException(
        500,
        "Error al obtener los IDs de los usuarios",
        usersError,
      );
    }

    if (!usersIds || usersIds.length === 0) {
      throw new ApiException(
        404,
        "No se encontraron usuarios en este grupo familiar",
      );
    }

    // Pasar ids del obj a un array
    const userIdsArray = usersIds.map((u) => u.id);

    // Obtener todas las actividades
    const { data: activities, error: activitiesError } = await this.supabase
      .from("activities")
      .select("*")
      .in("createdBy", userIdsArray);

    if (activitiesError) {
      throw new ApiException(
        500,
        "Error al obtener las actividades",
        activitiesError,
      );
    }

    if (!activities || activities.length === 0) {
      throw new ApiException(
        404,
        "No se encontraron actividades para este grupo familiar",
      );
    }

    return activities;
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
