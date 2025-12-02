import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase-types";
import { OAuth2Client } from "google-auth-library";
import type { Context } from "hono";

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

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
  private oauth2Client: OAuth2Client;

  constructor(private supabase: SupabaseClient<Database>) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.API_BASE_URL}/activities/google-calendar/callback`,
    );
  }

  /**
   * Get Google OAuth URL for Calendar access
   */
  getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.app.created"],
      prompt: "consent",
      state: userId, // Pass Supabase user ID as state
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleCalendarTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to obtain required tokens from Google");
      }

      const expiresIn = tokens.expiry_date
        ? Math.floor(
            ((tokens.expiry_date as unknown as Date).getTime() - Date.now()) /
              1000,
          )
        : 3600;

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token!,
        expires_in: expiresIn,
        scope:
          tokens.scope ||
          "https://www.googleapis.com/auth/calendar.app.created",
      };
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Store Google Calendar tokens for a user using RPC
   */
  async storeTokens(
    userId: string,
    tokens: GoogleCalendarTokens,
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("store_google_tokens", {
        p_user_id: userId,
        p_access_token: tokens.access_token,
        p_refresh_token: tokens.refresh_token,
        p_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
        p_scope: tokens.scope,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error storing tokens:", error);
      throw new Error("Failed to store Google Calendar tokens");
    }
  }

  /**
   * Get Google Calendar API client for a user
   */
  private async getCalendarClient(userId: string): Promise<OAuth2Client> {
    try {
      // Get stored Google Calendar tokens using RPC
      const { data: tokens, error } = await this.supabase.rpc(
        "get_google_tokens",
        {
          p_user_id: userId,
        },
      );

      if (error) {
        throw new Error(`Failed to get Google tokens: ${error.message}`);
      }

      if (!tokens || tokens.length === 0) {
        throw new Error(
          "Google Calendar tokens not found - please complete OAuth authorization first",
        );
      }

      const tokenData = tokens[0]!;

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt.getTime() <= Date.now()) {
        throw new Error("Google Calendar token expired - please re-authorize");
      }

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      // Set credentials with stored tokens
      oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      return oauth2Client;
    } catch (error) {
      console.error("Error getting calendar client:", error);
      throw error;
    }
  }

  /**
   * Execute Google Calendar operation with token refresh
   */
  private async executeWithRefresh<T>(
    userId: string,
    operation: (auth: OAuth2Client) => Promise<T>,
    context?: Context,
  ): Promise<T> {
    try {
      const auth = await this.getCalendarClient(userId);
      return await operation(auth);
    } catch (error) {
      // Check if it's a token expiration error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode =
        (error as { code?: number; status?: number })?.code ||
        (error as { code?: number; status?: number })?.status;

      if (
        errorMessage.includes("invalid_grant") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("Login Required") ||
        errorCode === 401
      ) {
        console.log("Token expired, attempting refresh...");

        try {
          // Get current tokens
          const { data: tokens, error: tokenError } = await this.supabase.rpc(
            "get_google_tokens",
            { p_user_id: userId },
          );

          if (tokenError || !tokens || tokens.length === 0) {
            throw new Error("No tokens found for refresh");
          }

          const tokenData = tokens[0]!;

          // Create OAuth2 client for refresh
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
          );

          // Set credentials with refresh token
          oauth2Client.setCredentials({
            refresh_token: tokenData.refresh_token,
          });

          // Refresh the tokens
          const { credentials } = await oauth2Client.refreshAccessToken();

          if (!credentials.access_token) {
            throw new Error("Failed to refresh access token");
          }

          // Store refreshed tokens
          const newTokens: GoogleCalendarTokens = {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || tokenData.refresh_token,
            expires_in: credentials.expiry_date
              ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
              : 3600,
            scope: credentials.scope || tokenData.scope,
          };

          await this.storeTokens(userId, newTokens);

          console.log("Successfully refreshed Google tokens");

          // Update context with new session if available
          if (context && context.get("session")) {
            const session = context.get("session");
            session.provider_token = newTokens.access_token;
            context.set("session", session);
          }

          // Retry operation with refreshed tokens
          const auth = await this.getCalendarClient(userId);
          return await operation(auth);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw new Error(
            "Authentication failed - please re-authenticate with Google",
          );
        }
      }

      throw error;
    }
  }

  /**
   * Create or get Elepad calendar for a user
   */
  private async getOrCreateElepadCalendar(
    userId: string,
    context?: Context,
  ): Promise<string> {
    return this.executeWithRefresh(
      userId,
      async (auth) => {
        try {
          // First, check if user already has a calendar ID stored
          const { data: user } = await this.supabase
            .from("users")
            .select("google_calendar_id")
            .eq("id", userId)
            .single();

          if (user?.google_calendar_id) {
            // Verify stored calendar ID still exists and is accessible
            try {
              await this.calendar.calendars.get({
                auth,
                calendarId: user.google_calendar_id,
              });
              return user.google_calendar_id;
            } catch (error) {
              console.log(
                "Stored calendar ID not accessible, creating new one:",
                error,
              );
              // Fall through to create new calendar
            }
          }

          // Create new Elepad calendar
          const newCalendar = await this.calendar.calendars.insert({
            auth,
            requestBody: {
              summary: "Elepad",
              description: "Actividades sincronizadas desde Elepad",
              timeZone: "America/Argentina/Buenos_Aires",
            },
          });

          const calendarId = newCalendar.data.id!;

          // Store the new calendar ID in the database
          await this.supabase
            .from("users")
            .update({ google_calendar_id: calendarId })
            .eq("id", userId);

          return calendarId;
        } catch (error) {
          console.error("Error creating Elepad calendar:", error);
          throw new Error("Failed to create Elepad calendar");
        }
      },
      context,
    );
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    userId: string,
    activity: {
      id: string;
      title: string;
      description?: string | null;
      startsAt: Date;
      endsAt?: Date;
    },
    context?: Context,
  ): Promise<string> {
    return this.executeWithRefresh(
      userId,
      async (auth) => {
        try {
          const calendarId = await this.getOrCreateElepadCalendar(
            userId,
            context,
          );

          const eventData: Record<string, unknown> = {
            summary: activity.title,
            description: activity.description || "",
            start: {
              dateTime: activity.startsAt.toISOString(),
              timeZone: "America/Argentina/Buenos_Aires",
            },
          };

          if (activity.endsAt) {
            (eventData as Record<string, unknown>).end = {
              dateTime: activity.endsAt.toISOString(),
              timeZone: "America/Argentina/Buenos_Aires",
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
      },
      context,
    );
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
    context?: Context,
  ): Promise<void> {
    return this.executeWithRefresh(
      userId,
      async (auth) => {
        try {
          const calendarId = await this.getOrCreateElepadCalendar(
            userId,
            context,
          );

          const eventData: Record<string, unknown> = {
            summary: activity.title,
            description: activity.description || "",
            start: {
              dateTime: activity.startsAt.toISOString(),
              timeZone: "America/Argentina/Buenos_Aires",
            },
          };

          if (activity.endsAt) {
            (eventData as Record<string, unknown>).end = {
              dateTime: activity.endsAt.toISOString(),
              timeZone: "America/Argentina/Buenos_Aires",
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
      },
      context,
    );
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(
    userId: string,
    googleEventId: string,
    context?: Context,
  ): Promise<void> {
    return this.executeWithRefresh(
      userId,
      async (auth) => {
        try {
          const calendarId = await this.getOrCreateElepadCalendar(
            userId,
            context,
          );

          await this.calendar.events.delete({
            auth,
            calendarId,
            eventId: googleEventId,
          });
        } catch (error) {
          console.error("Error deleting Google Calendar event:", error);
          throw new Error("Failed to delete Google Calendar event");
        }
      },
      context,
    );
  }

  /**
   * Check if user has Google Calendar enabled
   */
  async isGoogleCalendarEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("google_calendar_enabled")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.google_calendar_enabled || false;
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
      const { error } = await this.supabase
        .from("users")
        .update({
          google_calendar_enabled: true,
          google_calendar_id: calendarId || null,
        })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to enable Google Calendar: ${error.message}`);
      }
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
      const { error } = await this.supabase
        .from("users")
        .update({
          google_calendar_enabled: false,
          google_calendar_id: null,
        })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to disable Google Calendar: ${error.message}`);
      }
    } catch (error) {
      console.error("Error disabling Google Calendar:", error);
      throw new Error("Failed to disable Google Calendar");
    }
  }

  /**
   * Sync existing activities to Google Calendar
   */
  async syncExistingActivities(
    userId: string,
    context?: Context,
  ): Promise<void> {
    try {
      // Get activities that haven't been synced yet
      const { data: activities, error } = await this.supabase
        .from("activities")
        .select("*")
        .eq("createdBy", userId)
        .is("google_event_id", null);

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      if (!activities || activities.length === 0) {
        console.log("No activities to sync for user:", userId);
        return;
      }

      console.log(
        `Syncing ${activities.length} activities to Google Calendar for user: `,
        userId,
      );

      // Sync each activity
      for (const activity of activities) {
        try {
          const googleEventId = await this.createEvent(
            userId,
            {
              id: activity.id,
              title: activity.title,
              description: activity.description,
              startsAt: new Date(activity.startsAt),
              endsAt: activity.endsAt ? new Date(activity.endsAt) : undefined,
            },
            context,
          );

          // Update activity with Google event ID
          await this.supabase
            .from("activities")
            .update({
              google_event_id: googleEventId,
              google_sync_status: "synced",
            })
            .eq("id", activity.id);

          console.log(`Synced activity ${activity.id} to Google Calendar`);
        } catch (error) {
          console.error(`Failed to sync activity ${activity.id}:`, error);

          // Mark as failed
          await this.supabase
            .from("activities")
            .update({
              google_sync_status: "error",
            })
            .eq("id", activity.id);
        }
      }
    } catch (error) {
      console.error("Error in batch sync:", error);
      throw new Error("Failed to sync existing activities");
    }
  }
}
