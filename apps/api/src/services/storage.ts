import { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "profile-avatar";

/** Turn the file name into an URL-compatible name. */
function urlify(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * Uploads a profile avatar to Supabase Storage and returns the public URL.
 */
export async function uploadUserAvatarImage(
  supabase: SupabaseClient,
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
