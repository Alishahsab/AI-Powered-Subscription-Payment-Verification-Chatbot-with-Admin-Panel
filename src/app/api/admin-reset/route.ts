import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
// Only this email can reset the admin password. It is checked here, on the server, so it is not shown in the page.
const adminEmail = (process.env.ADMIN_RESET_EMAIL ?? "amuhammadaadi24@gmail.com").toLowerCase();

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: "" }));
  if (typeof email !== "string" || email.trim().toLowerCase() !== adminEmail) {
    return new Response("This email cannot reset the admin password.", { status: 403 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  // Sends the "Magic Link" email, whose template shows the one-time code.
  const { error } = await supabase.auth.signInWithOtp({ email: adminEmail, options: { shouldCreateUser: false } });
  if (error) return new Response(error.message, { status: error.status === 429 ? 429 : 502 });
  return Response.json({ sent: true });
}
