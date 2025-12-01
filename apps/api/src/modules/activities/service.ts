import { ApiException } from "@/utils/api-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import type { NewActivity, UpdateActivity } from "./schema";
import { GoogleCalendarService } from "@/services/google-calendar";

export class ActivityService {
  private googleCalendarService: GoogleCalendarService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.googleCalendarService = new GoogleCalendarService(supabase);
  }

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

    // Sync with Google Calendar if enabled
    try {
      const isEnabled =
        await this.googleCalendarService.isGoogleCalendarEnabled(
          payload.createdBy,
        );
      if (isEnabled) {
        await this.googleCalendarService.createEvent(payload.createdBy, {
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          startsAt: new Date(data.startsAt),
          endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        });

        // TODO: After migration, update activity with Google event ID and sync status
        console.log("Google Calendar event created for activity:", data.id);
      }
    } catch (googleError) {
      console.error("Google Calendar sync failed:", googleError);
      // TODO: After migration, update activity with error status
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

    // Sync with Google Calendar if enabled
    try {
      const isEnabled =
        await this.googleCalendarService.isGoogleCalendarEnabled(
          data.createdBy,
        );
      if (isEnabled) {
        // TODO: After migration, get google_event_id from activity
        // For now, we'll skip Google Calendar sync on updates
        console.log("Would sync Google Calendar update for activity:", id);
      }
    } catch (googleError) {
      console.error("Google Calendar sync failed:", googleError);
    }

    return data;
  }

  async remove(id: string) {
    // Get activity details before deletion for Google Calendar sync
    const { data: activity } = await this.supabase
      .from("activities")
      .select("createdBy")
      .eq("id", id)
      .single();

    const { error } = await this.supabase
      .from("activities")
      .delete()
      .eq("id", id);
    if (error) {
      throw new ApiException(500, "Error al eliminar la actividad", error);
    }

    // Delete from Google Calendar if enabled
    if (activity) {
      try {
        const isEnabled =
          await this.googleCalendarService.isGoogleCalendarEnabled(
            activity.createdBy,
          );
        if (isEnabled) {
          // TODO: After migration, get google_event_id from activity
          // For now, we'll skip Google Calendar sync on deletion
          console.log("Would delete from Google Calendar for activity:", id);
        }
      } catch (googleError) {
        console.error("Google Calendar sync failed:", googleError);
      }
    }

    return true;
  }
}
