import { createId } from "../format";
import { getActiveClient } from "./sync";

const BUCKET = "guides";

export async function uploadGuideImage(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${createId()}.jpg`;
  const client = getActiveClient();

  const { error } = await client.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(error.message);

  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
