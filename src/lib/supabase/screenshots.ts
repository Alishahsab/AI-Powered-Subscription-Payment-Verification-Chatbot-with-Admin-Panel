import { createId } from "../format";
import { getActiveClient } from "./sync";

const BUCKET = "screenshots";
const signedUrls = new Map<string, string>();

function extensionFor(type: string) {
  if (type === "image/svg+xml") return "svg";
  if (type === "image/png") return "png";
  return "jpg";
}

export async function uploadScreenshot(customerId: string, dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${customerId}/${createId()}.${extensionFor(blob.type)}`;

  const { error } = await getActiveClient().storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(error.message);

  return path;
}

export async function getScreenshotUrl(path: string) {
  if (path.startsWith("data:")) return path;

  const cached = signedUrls.get(path);
  if (cached) return cached;

  const { data, error } = await getActiveClient().storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data) return null;

  signedUrls.set(path, data.signedUrl);
  return data.signedUrl;
}

export async function deleteScreenshots(paths: string[]) {
  const storedPaths = paths.filter((path) => !path.startsWith("data:"));
  if (storedPaths.length === 0) return;
  await getActiveClient().storage.from(BUCKET).remove(storedPaths);
}
