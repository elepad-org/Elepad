import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end?: {
    dateTime: string;
    timeZone: string;
  };
}

export class GoogleCalendarService {
  private calendar = google.calendar("v3");

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get Google Calendar API client for a user
   */
  private async getCalendarClient(userId: string) {
    // Get user's Google OAuth tokens from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.admin.getUserById(userId);

    if (authError || !user) {
      throw new Error("User not found");
    }

    // Get Google provider token
    const googleProvider = user.app_metadata?.providers?.find(
      (p: string) => p === "google",
    );
    if (!googleProvider) {
      throw new Error("Google OAuth not configured for user");
    }

    // Get access token from user's identities
    const googleIdentity = user.identities?.find(
      (identity) => identity.provider === "google",
    );
    if (!googleIdentity) {
      throw new Error("Google identity not found");
    }

    // For now, we'll use a placeholder approach
    // In a real implementation, you'd need to refresh the access token
    // using refresh token stored in identity
    const accessToken = (
      googleIdentity as unknown as { identity_data?: { access_token?: string } }
    ).identity_data?.access_token;
    if (!accessToken) {
      throw new Error("Google access token not available");
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    return oauth2Client;
  }

  /**
   * Create or get Elepad calendar for a user
   */
  private async getOrCreateElepadCalendar(_userId: string): Promise<string> {
    const auth = await this.getCalendarClient(_userId);

    try {
      // Try to find existing Elepad calendar
      const calendarList = await this.calendar.calendarList.list({
        auth,
        minAccessRole: "writer",
      });

      const elepadCalendar = calendarList.data.items?.find(
        (cal) => cal.summary === "Elepad Actividades",
      );

      if (elepadCalendar) {
        return elepadCalendar.id!;
      }

      // Create new Elepad calendar
      const newCalendar = await this.calendar.calendars.insert({
        auth,
        requestBody: {
          summary: "Elepad Actividades",
          description: "Actividades sincronizadas desde Elepad",
          timeZone: "America/Mexico_City",
        },
      });

      return newCalendar.data.id!;
    } catch (error) {
      console.error("Error getting/creating Elepad calendar:", error);
      throw new Error("Failed to get or create Elepad calendar");
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    userId: string,
    activity: {
      id: string;
      title: string;
      description?: string;
      startsAt: Date;
      endsAt?: Date;
    },
  ): Promise<string> {
    try {
      const auth = await this.getCalendarClient(userId);
      const calendarId = await this.getOrCreateElepadCalendar(userId);

      const eventData: Record<string, unknown> = {
        summary: activity.title,
        description: activity.description || "",
        start: {
          dateTime: activity.startsAt.toISOString(),
          timeZone: "America/Mexico_City",
        },
      };

      if (activity.endsAt) {
        (eventData as Record<string, unknown>).end = {
          dateTime: activity.endsAt.toISOString(),
          timeZone: "America/Mexico_City",
        };
      }

      const response = await this.calendar.events.insert({
        auth,
        calendarId,
        requestBody: eventData,
      });

      return response.data.id!;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw new Error("Failed to create Google Calendar event");
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(
    userId: string,
    googleEventId: string,
    activity: {
      title: string;
      description?: string;
      startsAt: Date;
      endsAt?: Date;
    },
  ): Promise<void> {
    try {
      const auth = await this.getCalendarClient(userId);
      const calendarId = await this.getOrCreateElepadCalendar(userId);

      const eventData: Record<string, unknown> = {
        summary: activity.title,
        description: activity.description || "",
        start: {
          dateTime: activity.startsAt.toISOString(),
          timeZone: "America/Mexico_City",
        },
      };

      if (activity.endsAt) {
        (eventData as Record<string, unknown>).end = {
          dateTime: activity.endsAt.toISOString(),
          timeZone: "America/Mexico_City",
        };
      }

      await this.calendar.events.update({
        auth,
        calendarId,
        eventId: googleEventId,
        requestBody: eventData,
      });
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw new Error("Failed to update Google Calendar event");
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(userId: string, googleEventId: string): Promise<void> {
    try {
      const auth = await this.getCalendarClient(userId);
      const calendarId = await this.getOrCreateElepadCalendar(userId);

      await this.calendar.events.delete({
        auth,
        calendarId,
        eventId: googleEventId,
      });
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw new Error("Failed to delete Google Calendar event");
    }
  }

  /**
   * Check if user has Google Calendar enabled
   */
  async isGoogleCalendarEnabled(userId: string): Promise<boolean> {
    try {
      // For now, return false until we add the columns to database
      // TODO: After migration, use: return user?.google_calendar_enabled || false;
      console.log("Checking Google Calendar for user:", userId);
      return false;
    } catch (error) {
      console.error("Error checking Google Calendar status:", error);
      return false;
    }
  }

  /**
   * Enable Google Calendar for a user
   */
  async enableGoogleCalendar(
    userId: string,
    calendarId?: string,
  ): Promise<void> {
    try {
      // For now, just log - will implement after database migration
      console.log(
        "Would enable Google Calendar for user:",
        userId,
        "calendar:",
        calendarId,
      );
      // TODO: After migration, update users table
    } catch (error) {
      console.error("Error enabling Google Calendar:", error);
      throw new Error("Failed to enable Google Calendar");
    }
  }

  /**
   * Disable Google Calendar for a user
   */
  async disableGoogleCalendar(userId: string): Promise<void> {
    try {
      // For now, just log - will implement after database migration
      console.log("Would disable Google Calendar for user:", userId);
      // TODO: After migration, update users table
    } catch (error) {
      console.error("Error disabling Google Calendar:", error);
      throw new Error("Failed to disable Google Calendar");
    }
  }
}
