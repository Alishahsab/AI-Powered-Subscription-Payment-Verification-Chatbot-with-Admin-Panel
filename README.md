# Premium Store

Web chatbot and admin panel for selling premium subscription codes. Customers buy and get support in a private chat; the admin verifies payment screenshots and sends codes from one dashboard.

## Tech

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- lucide-react icons

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Customer chatbot: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Supabase setup

1. Create a Supabase project and copy the Project URL and publishable key into `.env.local`.
2. Open SQL Editor, paste `supabase/schema.sql` and run it. It creates the tables, row level security, the private `screenshots` bucket and realtime.
3. Authentication > Sign In / Providers > Email: turn off "Confirm email" so customers can sign in with email and PIN straight away.
4. Authentication > Users > Add user: create the admin account (email + password).
5. Give that user admin access in SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'admin@example.com';
```

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `APP_MODE` | `customer` serves only the chatbot (`/admin` returns 404), `admin` serves only the admin panel, empty serves both |
| `NEXT_PUBLIC_CUSTOMER_URL` | Link used by "Open customer chat" in the admin sidebar |

## Folder structure

```
src/
  app/                      Routes: customer chatbot (/) and admin panel (/admin)
  hooks/                    Small shared hooks (timers, screen size, presence, order expiry)
  lib/
    types.ts                All data types
    format.ts               Money, date and text helpers
    availability.ts         Working hours and admin status
    browser.ts              Image compression, clipboard, alert sound
    defaults.ts             Default settings, plans, payment methods and FAQs
    demo/                   Sample payment receipt for testing
    store/
      state.ts              In-memory app state used by the components
      helpers.ts            Shared helpers used by the actions
      customer.ts           Everything the customer can do
      admin.ts              Everything the admin can do
    supabase/
      client.ts             Supabase clients (separate sessions for customer and admin)
      mappers.ts            Database rows to app objects and back
      tables.ts             Which tables are synced and how
      sync.ts               Loads data, saves changes and listens for realtime updates
      screenshots.ts        Upload and signed URLs for the private screenshots bucket
supabase/
  schema.sql                Tables, security rules, storage bucket and realtime
  components/
    BrandIcon.tsx
    customer/
      CustomerApp.tsx       Session and layout
      AuthScreen.tsx        Sign in / create account (email + PIN)
      Sidebar.tsx           Desktop sidebar
      chat/
        ChatScreen.tsx      Chat page
        MessageList.tsx     Messages and typing indicator
        MessageItem.tsx     One message
        ActionPanel.tsx     Buttons shown for the current step
        actions/            Menu, plans, methods, terms, payment, support, composers
        cards/              Payment details, wallet steps, payment proof
        sheets/             Upload proof and report payment issue
    admin/
      AdminApp.tsx          Login gate
      AdminShell.tsx        Layout and navigation
      layout/               Sidebar, top bar, status switch, notifications, toasts
      dashboard/            Dashboard and recent orders
      inbox/                Chat list, thread, reply box, order review, tickets
      customers/            Customers table
      search/               Global search
      settings/             Settings page and one file per tab
      ui/                   Buttons, badges, cards, toggles and other small UI parts
```

## How the chat works

Each customer has one conversation with a `stage` (`menu`, `choose_plan`, `choose_method`, `terms`, `awaiting_payment`, `support`, `support_other`, `live`). The customer only taps buttons; `ActionPanel` shows the buttons for the current stage, and the actions in `lib/store/customer.ts` add messages and move to the next stage.

## Data

Components read from one in-memory state (`lib/store/state.ts`). The actions in `lib/store/customer.ts` and `lib/store/admin.ts` are the only place that changes it. After every change, `lib/supabase/sync.ts` compares the old and new state and writes the changed rows to Supabase. Changes made by other people arrive through Supabase Realtime and update the same state, so the customer chat and the admin panel stay in sync on any device.

Row level security makes sure a customer can only read and write their own customer row, conversation, orders, messages and tickets. Only users listed in the `admins` table can see everything.
