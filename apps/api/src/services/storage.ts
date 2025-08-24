import { createSupabaseClient } from "@/config";

const AVATAR_BUCKET = "profile-avatar";

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_.-]/g, "_");

export async function uploadProfileAvatar(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createSupabaseClient();
  const originalName = file.name || `avatar-${Date.now()}`;
  const safeName = sanitize(originalName);
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
