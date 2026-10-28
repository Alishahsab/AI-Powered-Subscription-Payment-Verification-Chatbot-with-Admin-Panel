create table if not exists public.admin_devices (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null default 'android',
  updated_at bigint not null default public.now_ms()
);

alter table public.admin_devices enable row level security;

drop policy if exists "admins manage devices" on public.admin_devices;
create policy "admins manage devices" on public.admin_devices
for all to authenticated
using (public.is_admin())
with check (public.is_admin() and user_id = auth.uid());
