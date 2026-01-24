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

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
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
    imageBase64: "",
    caption: "",
    date: "",
    error: "",
  };

  try {
    // Attempt to get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      widgetProps.error = "Abre la app para sincronizar";
    } else {
      const userId = session.user.id;

      // Get user's groupId
      const { data: userRow } = await supabase
        .from("users")
        .select("groupId")
        .eq("id", userId)
        .single();

      // Fetch recent memories with media (broad query)
      const { data: rawMemories } = await supabase
        .from("memories")
        .select("id, title, caption, mediaUrl, mimeType, createdAt")
        .eq("groupId", userRow?.groupId || "")
        .neq("mediaUrl", null)
        .order("createdAt", { ascending: false })
        .limit(20);

      // Filter for images in JS to be robust against missing mimeTypes
      const memories = (rawMemories || [])
        .filter((m) => {
          if (m.mimeType && m.mimeType.startsWith("image/")) return true;
          if (m.mimeType && m.mimeType.startsWith("video/")) return false;

          // If mimeType is missing, check extension allowing query params
          if (m.mediaUrl) {
            const lower = m.mediaUrl.toLowerCase();
            // Check for image extension, even if followed by query params
            return /\.(jpeg|jpg|png|webp|bmp|heic)(\?.*)?$/.test(lower);
          }
          return false;
        })
        .slice(0, 5);

      if (memories && memories.length > 0) {
        // --- Logic to Pick Photo ---
        // We use AsyncStorage to store the last shown index to cycle through them
        // Key: `widget_last_index_${widgetInfo.widgetId}`

        let nextIndex = 0;
        const storageKey = `widget_last_index_${widgetInfo.widgetId}`;

        try {
          // If we are triggered by REFRESH or normal UPDATE, cycle.
          const lastIndexStr = await AsyncStorage.getItem(storageKey);
          const lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : -1;

          // Cycle: (last + 1) % length
          nextIndex = (lastIndex + 1) % memories.length;

          await AsyncStorage.setItem(storageKey, nextIndex.toString());
        } catch (_err) {
          console.log("Error reading widget state", _err);
          // Fallback to random if storage fails
          nextIndex = Math.floor(Math.random() * memories.length);
        }

        const memory = memories[nextIndex];
        const b64 = await urlToBase64(memory.mediaUrl);

        if (b64) {
          widgetProps.imageBase64 = b64;
          widgetProps.caption = formatCaption(memory);

          // Format Date
          try {
            const dateObj = new Date(memory.createdAt);
            widgetProps.date = format(dateObj, "d 'de' MMMM 'de' yyyy", {
              locale: es,
            });
          } catch {
            widgetProps.date = "";
          }
        } else {
          widgetProps.error = "Error cargando imagen";
        }
      } else {
        widgetProps.error = "Sin fotos recientes";
      }
    }
  } catch (e) {
    console.error("Widget Error:", e);
    widgetProps.error = "Error de conexión";
  }

  props.renderWidget(<Widget {...widgetProps} />);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCaption(memory: any): string {
  return memory.caption || memory.title || "";
}
