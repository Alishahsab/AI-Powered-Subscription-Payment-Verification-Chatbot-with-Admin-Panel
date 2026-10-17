# Premium Store

Web chatbot and admin panel for selling premium subscription codes. Customers buy and get support in a private chat; the admin verifies payment screenshots and sends codes from one dashboard.

## Tech

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- lucide-react icons

## Getting started

```bash
npm install
npm run dev
```

- Customer chatbot: http://localhost:3000
- Admin panel: http://localhost:3000/admin (demo login `admin` / `admin123`)

Open both in the same browser to see orders and messages sync live.

## Environment variables

| Name | Purpose |
| --- | --- |
| `APP_MODE` | `customer` serves only the chatbot (`/admin` returns 404), `admin` serves only the admin panel, empty serves both |
| `NEXT_PUBLIC_CUSTOMER_URL` | Link used by "Open customer chat" in the admin sidebar |
| `NEXT_PUBLIC_ADMIN_USER`, `NEXT_PUBLIC_ADMIN_PASSWORD` | Demo admin login |

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
    demo/                   Demo seed data and sample receipt
    store/
      state.ts              App state, saving and cross-tab sync
      helpers.ts            Shared helpers used by the actions
      customer.ts           Everything the customer can do
      admin.ts              Everything the admin can do
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

The demo keeps all data in `localStorage` (`lib/store/state.ts`). The actions in `lib/store/customer.ts` and `lib/store/admin.ts` are the only place that changes data, so moving to Supabase means replacing those functions without touching the components.
