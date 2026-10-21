import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const resendKey = process.env.RESEND_API_KEY ?? "";
const fromAddress = process.env.EMAIL_FROM ?? "Premium Store <onboarding@resend.dev>";

// Change CHAT_URL in Vercel when the store gets its own domain.
const chatUrl = process.env.CHAT_URL ?? "https://premium-store-nu.vercel.app/";
const storeName = "Premium Store";

const subject = `You have a new message from ${storeName}`;

const text = `Hi there,

You have a new message from the ${storeName} team in your chat.

For your privacy, we don't include the message in this email. Please open your chat to read it:
${chatUrl}

Thank you,
${storeName}

You received this email because you have an account at ${storeName}.`;

// The message itself stays in the chat; the email only says that one is waiting.
const html = `<div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="background:#0C2660;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">${storeName}</div>
    <div style="padding:28px;font-size:15px;line-height:1.6;color:#111827">
      <p style="margin:0 0 16px">Hi there,</p>
      <p style="margin:0 0 16px">You have a <strong>new message</strong> from the ${storeName} team in your chat.</p>
      <p style="margin:0 0 24px">For your privacy, we don't include the message in this email. Please open your chat to read it.</p>
      <p style="margin:0 0 24px"><a href="${chatUrl}" style="display:inline-block;background:#0C2660;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px">Open chat</a></p>
      <p style="margin:0;color:#6b7280;font-size:13px">If the button doesn't work, open this link: <a href="${chatUrl}" style="color:#0C2660">${chatUrl}</a></p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">You received this email because you have an account at ${storeName}.</div>
  </div>
</div>`;

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

  const { customerId } = await request.json();

  const { data: customer } = await supabase.from("customers").select("email").eq("id", customerId).maybeSingle();
  if (!customer) return new Response("Customer not found", { status: 404 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: fromAddress,
      to: customer.email,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) return new Response(await response.text(), { status: 502 });
  return Response.json({ sent: true });
}
