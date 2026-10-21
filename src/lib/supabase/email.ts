import { getSupabase } from "./client";

// Emails the customer that a new message is waiting in the chat. The message itself stays in the chat.
export async function sendEmailCopy(customerId: string) {
  const { data } = await getSupabase("admin").auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;

  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ customerId }),
  });

  if (!response.ok) console.error("Email could not be sent", await response.text());
  return response.ok;
}
