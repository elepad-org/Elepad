import { Database } from "@/supabase-types";
import { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "profile-avatar";
const MEMORIES_BUCKET = "memories";

/** Turn the file name into an URL-compatible name. */
function urlify(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * Determines the media type folder based on file MIME type
 */
function getMediaTypeFolder(mimeType: string): string {
  if (mimeType.startsWith("image/")) {
    return "imagenes";
  } else if (mimeType.startsWith("video/")) {
    return "videos";
  } else if (mimeType.startsWith("audio/")) {
    return "audios";
  } else {
    return "otros"; // Para otros tipos de archivos
  }
}

/**
 * Uploads a profile avatar to Supabase Storage and returns the public URL.
 */
export async function uploadUserAvatarImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
): Promise<string> {
  const originalName = file.name || `avatar-${Date.now()}`;
  const path = `${userId}/${Date.now()}-${urlify(originalName)}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a memory media file to Supabase Storage organized by media type and returns the public URL.
 * Files are organized as: {groupId}/{mediaType}/{fileName}
 * Where mediaType can be: imagenes, videos, audios, otros
 */
export async function uploadMemoryImage(
  supabase: SupabaseClient<Database>,
  groupId: string,
  file: File,
): Promise<string> {
  const originalName = file.name || `memory-${Date.now()}`;
  const fileExtension = originalName.split(".").pop() || "bin";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

  // Determinar el tipo de media y crear el path organizado
  const mediaTypeFolder = getMediaTypeFolder(
    file.type || "application/octet-stream",
  );
  const path = `${groupId}/${mediaTypeFolder}/${fileName}`;

  const { error } = await supabase.storage
    .from(MEMORIES_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Memory media upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
