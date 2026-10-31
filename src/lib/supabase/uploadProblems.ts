import { getActiveClient } from "./sync";

export function recordUploadProblem(reason: string) {
  getActiveClient()
    .from("upload_problems")
    .insert({ reason: reason.slice(0, 200), browser: navigator.userAgent.slice(0, 300) })
    .then(
      () => undefined,
      () => undefined
    );
}
