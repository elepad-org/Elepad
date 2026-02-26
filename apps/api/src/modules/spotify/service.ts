import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { ApiException } from "@/utils/api-error";
import dotenv from "dotenv";

dotenv.config();

export class SpotifyService {
  private supabase: SupabaseClient<Database>;
  private spotifyClientId: string;
  private spotifyClientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID || "";
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";

    if (!this.spotifyClientId || !this.spotifyClientSecret) {
      console.warn("⚠️ Spotify credentials not configured");
    }
  }

  /**
   * Get Spotify access token using client credentials flow
   * Implements token caching to avoid unnecessary API calls
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.spotifyClientId || !this.spotifyClientSecret) {
      throw new ApiException(500, "Spotify credentials not configured");
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.spotifyClientId,
          client_secret: this.spotifyClientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        token_type: string;
        expires_in: number;
      };

      // Cache token with 5 minute buffer before expiry
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      return data.access_token;
    } catch (error) {
      console.error("Error fetching Spotify access token:", error);
      throw new ApiException(500, "Error authenticating with Spotify");
    }
  }

  /**
   * Get artist data from Spotify API
   */
  async getArtist(artistId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiException(404, "Artist not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      console.error("Error fetching artist data from Spotify:", error);
      throw new ApiException(500, "Error fetching artist data from Spotify");
    }
  }

  /**
   * Get track data from Spotify API
   */
  async getTrack(trackId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiException(404, "Track not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      console.error("Error fetching track data from Spotify:", error);
      throw new ApiException(500, "Error fetching track data from Spotify");
    }
  }

  /**
   * Search on Spotify (tracks, artists, albums)
   */
  async search(
    query: string,
    type: "track" | "artist" | "album" = "track",
    limit: number = 20
  ): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const params = new URLSearchParams({
        q: query,
        type: type,
        limit: limit.toString(),
      });

      const response = await fetch(
        `https://api.spotify.com/v1/search?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error searching on Spotify:", error);
      throw new ApiException(500, "Error searching on Spotify");
    }
  }
}
