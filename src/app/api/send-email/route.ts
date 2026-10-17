import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const resendKey = process.env.RESEND_API_KEY ?? "";
const fromAddress = process.env.EMAIL_FROM ?? "Premium Store <onboarding@resend.dev>";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(name: string, message: string, instructions: string) {
  const paragraphs = [message, instructions]
    .filter(Boolean)
    .map((text) => `<p style="margin:0 0 16px;white-space:pre-line">${escapeHtml(text)}</p>`)
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827;max-width:520px">
    <p style="margin:0 0 16px">Hi ${escapeHtml(name)},</p>
    ${paragraphs}
    <p style="margin:0;color:#6b7280">Premium Store</p>
  </div>`;
}

export async function POST(request: Request) {
  if (!resendKey) return new Response("Email is not configured", { status: 503 });

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return new Response("Not signed in", { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return new Response("Not signed in", { status: 401 });

  const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (!adminRow) return new Response("Admins only", { status: 403 });

  const { customerId, message, instructions } = await request.json();
  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    return new Response("Invalid message", { status: 400 });
  }

  const { data: customer } = await supabase.from("customers").select("name, email").eq("id", customerId).maybeSingle();
  if (!customer) return new Response("Customer not found", { status: 404 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: fromAddress,
      to: customer.email,
      subject: "Your Premium Store code",
      html: buildHtml(customer.name, message, typeof instructions === "string" ? instructions : ""),
    }),
  });

  if (!response.ok) return new Response(await response.text(), { status: 502 });
  return Response.json({ sent: true });
}
