import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { RecentPhotosWidget } from "./RecentPhotosWidget";
import { PhotosSquareWidget } from "./PhotosSquareWidget";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AsyncStorage from "@react-native-async-storage/async-storage";

const nameToWidget = {
  // This name must match the one in app.json configuration
  RecentPhotos: RecentPhotosWidget,
  PhotosSquare: PhotosSquareWidget,
};

interface WidgetMemory {
  mediaUrl?: string;
  title?: string;
  caption?: string;
  createdAt: string | number | Date;
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    let fetchUrl = url;
    // Resize via query params to keep base64 small $(< 500KB)
    if (url.includes("supabase.co") && !url.includes("width=")) {
      const char = url.includes("?") ? "&" : "?";
      fetchUrl = `${url}${char}width=500&quality=60`;
    }

    console.log("Widget: fetching base64 from", fetchUrl);
    const response = await fetch(fetchUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log("Widget: b64 len", base64data.length);
        if (base64data.length > 1500000) {
          // 1.5MB Limit
          console.log("Widget: Too big!");
          resolve(null);
        } else {
          // Return full data URI
          resolve(base64data);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image fetch error", e);
    return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;

  // Handle Refresh Action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (props.widgetAction === ("REFRESH" as any)) {
    // Force update or just proceed to re-fetch
  }

  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  if (!Widget) {
    console.error(`Widget name ${widgetInfo.widgetName} not found`);
    return;
  }

  // Default props
  const widgetProps = {
    imageBase64: "", // Back to base64
    title: "", // New prop for Title
    caption: "",
    date: "",
    error: "",
  };

  try {
    // Attempt to get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let user = null;
    let userError = null;

    if (session) {
      const userRes = await supabase.auth.getUser();
      user = userRes.data.user;
      userError = userRes.error;
    }

    if (!session) {
      widgetProps.error = "Abre la app";
    } else {
      // Validate token with server
      console.log(
        "Widget: auth.getUser:",
        user ? "OK" : "Error",
        userError?.message || "",
      );

      const userId = session.user.id; // Use session ID which is available even if getUser fails (though RLS might fail)

      // Get user's groupId
      const { data: userRow } = await supabase
        .from("users")
        .select("groupId")
        .eq("id", userId)
        .single();

      console.log("Widget: groupId", userRow?.groupId);

      // Fetch recent memories via API (bypassing direct RLS potential issues)
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.5:8787";
      const token = session.access_token;
      let rawMemories: WidgetMemory[] = [];
      let queryError: { message: string } | null | unknown = null;

      try {
        console.log(`Widget: API call...`);
        const response = await fetch(
          `${apiUrl}/memories?limit=20&groupId=${userRow?.groupId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const json = await response.json();
          // Handle potential pagination wrapper
          rawMemories = Array.isArray(json) ? json : json.data || [];
        } else {
          queryError = { message: `Status ${response.status}` };
          console.log(
            "Widget: API Error",
            response.status,
            await response.text(),
          );
        }
      } catch (e: unknown) {
        queryError = e;
        console.log("Widget: API Fetch Error", e);
      }

      if (queryError) {
        console.log("Widget: queryError", queryError);
      }
      console.log("Widget: rawMemories count", rawMemories?.length);

      // Filter for images in JS to be robust against missing mimeTypes
      const memories = (rawMemories || [])
        .filter((m) => {
          if (m.mediaUrl) {
            // Basic filtering
            return /\.(jpeg|jpg|png|webp|bmp|heic)(\?.*)?$/.test(
              m.mediaUrl.toLowerCase(),
            );
          }
          return false;
        })
        .slice(0, 5);

      console.log(`Widget: Found ${memories.length} photos`);

      if (memories && memories.length > 0) {
        // --- Logic to Pick Photo ---
        // We use AsyncStorage to store the last shown index to cycle through them
        // Key: `widget_last_index_${widgetInfo.widgetId}`

        let nextIndex = 0;
        const storageKey = `widget_last_index_${widgetInfo.widgetId}`;

        try {
          // If we are triggered by REFRESH or normal UPDATE, cycle.
          const last = await AsyncStorage.getItem(storageKey);
          const lastIdx = last ? parseInt(last, 10) : -1;

          // Cycle: (last + 1) % length
          nextIndex = (lastIdx + 1) % memories.length;

          await AsyncStorage.setItem(storageKey, nextIndex.toString());
        } catch (_err) {
          console.log("Error reading widget state", _err);
          // Fallback to random if storage fails
          nextIndex = Math.floor(Math.random() * memories.length);
        }

        const memory = memories[nextIndex]!;

        // Fetch Base64
        const b64 = await urlToBase64(memory.mediaUrl!);

        if (b64) {
          widgetProps.imageBase64 = b64;
          widgetProps.title = cleanText(memory.title ?? "RECUERDO");
          widgetProps.caption = cleanText(memory.caption ?? "");
          try {
            const dateObj = new Date(memory.createdAt);
            widgetProps.date = format(dateObj, "d 'de' MMMM", { locale: es });
          } catch {
            widgetProps.date = "";
          }
        } else {
          widgetProps.error = "Error cargando foto";
        }
      } else {
        const debugMsg = queryError
          ? `Err: ${(queryError as { message?: string })?.message || String(queryError)}`
          : `Sin fotos (Raw: ${rawMemories.length})`;
        widgetProps.error = debugMsg;
      }
    }
  } catch (e) {
    console.error("Widget Error:", e);
    widgetProps.error = "Error general";
  }

  props.renderWidget(<Widget {...widgetProps} />);
}

// Helper to clean text
function cleanText(text: string): string {
  if (!text) return "";
  // 1. Replace @[Name](id) -> Name
  let clean = text.replace(/@\[([^\]]+)\]\([^)]+\)/g, "$1");
  // 2. Replace <@id> -> @Usuario (Fallback if name unknown)
  clean = clean.replace(/<@[^>]+>/g, "");
  return clean.trim();
}
