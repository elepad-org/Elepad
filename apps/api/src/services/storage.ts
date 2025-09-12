import { Database } from "@/supabase-types";
import { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "profile-avatar";
const MEMORIES_BUCKET = "memories";

/** Turn the file name into an URL-compatible name. */
function urlify(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
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
 * Uploads a memory image to Supabase Storage and returns the public URL.
 */
export async function uploadMemoryImage(
  supabase: SupabaseClient<Database>,
  groupId: string,
  file: File,
): Promise<string> {
  const originalName = file.name || `memory-${Date.now()}`;
  const fileExtension = originalName.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
  const path = `memories/${groupId}/${fileName}`;

  const { error } = await supabase.storage
    .from(MEMORIES_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Memory image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
