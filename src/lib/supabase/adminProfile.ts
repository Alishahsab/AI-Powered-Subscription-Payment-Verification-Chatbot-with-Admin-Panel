import { createId } from "../format";
import { getSupabase } from "./client";

const BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type AdminProfile = {
  userId: string;
  email: string;
  name: string;
  avatarPath: string | null;
};

const client = () => getSupabase("admin");

export function avatarUrl(path: string | null) {
  if (!path) return null;
  return client().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function loadAdminProfile(): Promise<AdminProfile | null> {
  const { data: session } = await client().auth.getSession();
  const user = session.session?.user;
  if (!user) return null;

  const { data } = await client().from("admins").select("display_name, avatar_path").eq("user_id", user.id).maybeSingle();
  return {
    userId: user.id,
    email: user.email ?? "",
    name: data?.display_name || "Admin",
    avatarPath: data?.avatar_path ?? null,
  };
}

export async function saveAdminName(userId: string, name: string) {
  const { error } = await client().from("admins").update({ display_name: name }).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export function avatarProblem(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP photo.";
  if (file.size > MAX_AVATAR_BYTES) return "This photo is bigger than 2 MB. Please choose a smaller one.";
  return null;
}

export async function uploadAdminAvatar(profile: AdminProfile, file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${profile.userId}/${createId()}.${extension}`;

  const { error } = await client().storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);

  await setAvatarPath(profile, path);
  return path;
}

export async function removeAdminAvatar(profile: AdminProfile) {
  await setAvatarPath(profile, null);
}

async function setAvatarPath(profile: AdminProfile, path: string | null) {
  const { error } = await client().from("admins").update({ avatar_path: path }).eq("user_id", profile.userId);
  if (error) throw new Error(error.message);
  if (profile.avatarPath) await client().storage.from(BUCKET).remove([profile.avatarPath]);
}
