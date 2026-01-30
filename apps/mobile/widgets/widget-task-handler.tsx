import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { RecentPhotosWidget } from "./RecentPhotosWidget";
import { DailyActivitiesWidget } from "./DailyActivitiesWidget";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AsyncStorage from "@react-native-async-storage/async-storage";

const nameToWidget = {
  // This name must match the one in app.json configuration
  RecentPhotos: RecentPhotosWidget,
  DailyActivities: DailyActivitiesWidget,
};

interface WidgetMemory {
  id: string; // Add id field for deep linking
  mediaUrl?: string;
  title?: string;
  caption?: string;
  createdAt: string | number | Date;
}

interface Activity {
  id: string;
  title: string;
  startsAt: string;
  createdBy: string;
  assignedTo: string | null;
  completed: boolean;
}

interface ActivityWithName extends Activity {
  assignedToName: string | null | undefined;
}

interface User {
  id: string;
  displayName: string;
}

interface FamilyGroupMembersResponse {
  members: User[];
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    let fetchUrl = url;
    // Resize via query params to keep base64 manageable while maintaining quality
    if (url.includes("supabase.co") && !url.includes("width=")) {
      const char = url.includes("?") ? "&" : "?";
      fetchUrl = `${url}${char}width=800&quality=75`;
    }

    console.log("Widget: fetching base64 from", fetchUrl);
    const response = await fetch(fetchUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log("Widget: b64 len", base64data.length);

        // Return full data URI
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

  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  if (!Widget) {
    console.error(`Widget name ${widgetInfo.widgetName} not found`);
    return;
  }

  // Handle different widgets
  if (widgetInfo.widgetName === "DailyActivities") {
    await handleDailyActivitiesWidget(props, Widget);
  } else {
    // Handle photo widgets (RecentPhotos, PhotosSquare)
    await handlePhotoWidgets(props, Widget);
  }
}

// Handle DailyActivities Widget
async function handleDailyActivitiesWidget(
  props: WidgetTaskHandlerProps,
  Widget: React.ComponentType<Record<string, unknown>>,
) {

  // Handle Refresh Action: render loading state
  if (props.widgetAction === "WIDGET_UPDATE") {
    try {
      const loadingProps = {
        activities: [],
        error: "",
        isLoading: true,
      } as const;
      props.renderWidget(<Widget {...loadingProps} />);
    } catch (e) {
      console.log("Widget: failed to render loading state", e);
    }
  }

  const widgetProps: {
    activities?: ActivityWithName[];
    error?: string;
    isLoading?: boolean;
    isElder?: boolean;
  } = {
    activities: [],
    error: "",
    isLoading: false,
    isElder: false,
  };

  try {
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      widgetProps.error = "Toca para iniciar sesión";
      props.renderWidget(<Widget {...widgetProps} />);
      return;
    }

    const userId = session.user.id;

    // Get user's groupId and elder status
    const { data: userRow } = await supabase
      .from("users")
      .select("groupId, elder")
      .eq("id", userId)
      .single();

    if (!userRow?.groupId) {
      widgetProps.error = "No se encontró el grupo familiar";
      props.renderWidget(<Widget {...widgetProps} />);
      return;
    }

    console.log(
      "Widget DailyActivities: groupId",
      userRow.groupId,
      "elder:",
      userRow.elder,
    );

    // Set isElder in props
    widgetProps.isElder = userRow.elder;

    // Fetch activities from API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.5:8787";
    const token = session.access_token;

    try {
      console.log(`Widget DailyActivities: API call...`);
      const response = await fetch(
        `${apiUrl}/activities/familyCode/${userRow.groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const allActivities: Activity[] = await response.json();
        console.log(
          "Widget DailyActivities: fetched",
          allActivities.length,
          "activities",
        );

        // Get today's date range (start and end of day)
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
        );
        const endOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );

        // Filter activities for today
        let todayActivities = allActivities.filter((activity) => {
          const startsAt = new Date(activity.startsAt);
          return startsAt >= startOfToday && startsAt <= endOfToday;
        });

        console.log(
          "Widget DailyActivities: today's activities before filter:",
          todayActivities.length,
        );

        // Filter by role if user is elder
        if (userRow.elder === true) {
          todayActivities = todayActivities.filter((activity) => {
            return (
              activity.createdBy === userId || activity.assignedTo === userId
            );
          });
          console.log(
            "Widget DailyActivities: filtered for elder:",
            todayActivities.length,
          );
        }

        // Sort by startsAt ascending
        todayActivities.sort((a, b) => {
          return (
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          );
        });

        const res = await fetch(
          `${apiUrl}/familyGroup/${userRow.groupId}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data: FamilyGroupMembersResponse = await res.json();

        console.log(data);

        // Create a map of user IDs to names
        const userNamesMap: { [key: string]: string } = {};
        if (data.members) {
          data.members.forEach((user) => {
            userNamesMap[user.id] = user.displayName;
          });
        }
        
        // Add assignedToName to activities
        const activitiesWithNames = todayActivities.map((activity) => ({
          ...activity,
          assignedToName: activity.assignedTo
            ? userNamesMap[activity.assignedTo]
            : null,
        })) as ActivityWithName[];

        widgetProps.activities = activitiesWithNames;
      } else {
        console.log("Widget DailyActivities: API Error", response.status);
        widgetProps.error = "Toca para actualizar";
      }
    } catch (e: unknown) {
      console.log("Widget DailyActivities: API Fetch Error", e);
      widgetProps.error = "Toca para actualizar";
    }
  } catch (e) {
    console.error("Widget DailyActivities Error:", e);
    widgetProps.error = "Toca para actualizar";
  }

  props.renderWidget(<Widget {...widgetProps} />);
}

// Handle Photo Widgets (RecentPhotos, PhotosSquare)
async function handlePhotoWidgets(
  props: WidgetTaskHandlerProps,
  Widget: React.ComponentType<Record<string, unknown>>,
) {
  const { widgetInfo } = props;

  // Handle Refresh Action: render an immediate 'loading' state so the user
  // gets feedback, then continue with the normal update flow below.
  if (props.widgetAction === "WIDGET_UPDATE") {
    if (Widget) {
      try {
        const loadingProps = {
          imageBase64: "",
          title: "",
          caption: "",
          date: "",
          error: "",
          isLoading: true,
          memoryId: "", // New prop for deep link
        } as const;

        // Render a quick feedback UI while the handler continues to fetch
        props.renderWidget(<Widget {...loadingProps} />);
      } catch (e) {
        console.log("Widget: failed to render loading state", e);
      }
    }
  }

  // Default props
  const widgetProps = {
    imageBase64: "", // Back to base64
    title: "", // New prop for Title
    caption: "",
    date: "",
    error: "",
    memoryId: "", // New prop for deep link to memory
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
      widgetProps.error = "Toca para iniciar sesión";
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
          `${apiUrl}/memories?limit=10&groupId=${userRow?.groupId}`,
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
          widgetProps.memoryId = memory.id; // Set memoryId for deep link
          try {
            const dateObj = new Date(memory.createdAt);
            widgetProps.date = format(dateObj, "d 'de' MMMM", { locale: es });
          } catch {
            widgetProps.date = "";
          }
        } else {
          widgetProps.error = "Toca para actualizar";
        }
      } else {
        if (queryError) {
          widgetProps.error = "Toca para actualizar";
        } else {
          widgetProps.error =
            rawMemories.length === 0
              ? "Aún no hay recuerdos en tu grupo.\n¡Sé el primero en agregar uno!"
              : "Toca para actualizar";
        }
      }
    }
  } catch (e) {
    console.error("Widget Error:", e);
    widgetProps.error = "Toca para actualizar";
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
