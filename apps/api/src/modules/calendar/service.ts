import { createEvents, type EventAttributes } from "ics";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import { ApiException } from "@/utils/api-error";
import type { GenerateCalendarBody } from "./schema";

const STORAGE_BUCKET = "ics-calendars";

export class CalendarService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches activities for a user within a date range and generates a .ics string.
   * Uploads the file to Supabase Storage and persists the record in user_calendars.
   * Returns the generated calendarId.
   */
  async generateCalendar(
    body: GenerateCalendarBody,
    baseUrl: string,
  ): Promise<{ calendarId: string; feedUrl: string }> {
    const { userId, startDate, endDate } = body;

    const { data: activities, error: activitiesError } = await this.supabase
      .from("activities")
      .select("*")
      .or(`createdBy.eq.${userId},assignedTo.eq.${userId}`)
      .gte("startsAt", `${startDate}T00:00:00.000Z`)
      .lte("startsAt", `${endDate}T23:59:59.999Z`);

    if (activitiesError) {
      throw new ApiException(
        500,
        "Error al consultar actividades",
        activitiesError,
      );
    }

    if (!activities || activities.length === 0) {
      throw new ApiException(
        404,
        "No se encontraron actividades en el rango de fechas seleccionado",
      );
    }

    const events: EventAttributes[] = activities.map((act) => {
      const start = new Date(act.startsAt);
      const startTuple: [number, number, number, number, number] = [
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        start.getUTCDate(),
        start.getUTCHours(),
        start.getUTCMinutes(),
      ];

      const sharedFields = {
        uid: act.id,
        title: act.title,
        description: act.description ?? undefined,
        start: startTuple,
        startInputType: "utc" as const,
      };

      if (act.endsAt) {
        const end = new Date(act.endsAt);
        const endTuple: [number, number, number, number, number] = [
          end.getUTCFullYear(),
          end.getUTCMonth() + 1,
          end.getUTCDate(),
          end.getUTCHours(),
          end.getUTCMinutes(),
        ];
        return {
          ...sharedFields,
          end: endTuple,
          endInputType: "utc" as const,
        } as EventAttributes;
      }

      // Default duration of 1 hour when no end time is specified
      return { ...sharedFields, duration: { hours: 1 } } as EventAttributes;
    });

    const { error: icsError, value: icsString } = createEvents(events);
    if (icsError || !icsString) {
      throw new ApiException(
        500,
        "Error al generar el archivo iCalendar",
        icsError,
      );
    }

    const { data: calendarRecord, error: insertError } = await this.supabase
      .from("user_calendars")
      .insert({
        userId,
        startDate,
        endDate,
        storagePath: "pending", // Will be updated after upload
      })
      .select("id")
      .single();

    if (insertError || !calendarRecord) {
      throw new ApiException(
        500,
        "Error al guardar el registro del calendario",
        insertError,
      );
    }

    const calendarId = (calendarRecord as { id: string }).id;
    const storagePath = `${userId}/${calendarId}.ics`;

    // Upload .ics to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, icsString, {
        contentType: "text/calendar; charset=utf-8",
        upsert: true,
      });

    if (uploadError) {
      await this.supabase.from("user_calendars").delete().eq("id", calendarId);
      throw new ApiException(
        500,
        "Error al subir el archivo al almacenamiento",
        uploadError,
      );
    }

    const { error: updateError } = await this.supabase
      .from("user_calendars")
      .update({ storagePath })
      .eq("id", calendarId);

    if (updateError) {
      throw new ApiException(
        500,
        "Error al actualizar la ruta del archivo",
        updateError,
      );
    }

    const feedUrl = `${baseUrl}/calendar/feed/${calendarId}`;
    return { calendarId, feedUrl };
  }

  /**
   * Retrieves the .ics content for a given calendarId by downloading from Storage.
   */
  async getCalendarFeed(calendarId: string): Promise<string> {
    const { data: record, error: recordError } = await this.supabase
      .from("user_calendars")
      .select("storagePath")
      .eq("id", calendarId)
      .single();

    if (recordError || !record) {
      throw new ApiException(404, "Calendario no encontrado");
    }

    const storagePath = (record as { storagePath: string }).storagePath;

    // Download from Storage
    const { data: fileData, error: downloadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new ApiException(
        500,
        "Error al descargar el archivo del almacenamiento",
        downloadError,
      );
    }

    return await fileData.text();
  }
}
