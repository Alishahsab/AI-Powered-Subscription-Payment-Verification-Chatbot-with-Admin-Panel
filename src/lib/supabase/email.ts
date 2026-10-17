import { getSupabase } from "./client";

export async function sendEmailCopy(customerId: string, message: string, instructions: string) {
  const { data } = await getSupabase("admin").auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;

  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ customerId, message, instructions }),
  });

  if (!response.ok) console.error("Email could not be sent", await response.text());
  return response.ok;
}
