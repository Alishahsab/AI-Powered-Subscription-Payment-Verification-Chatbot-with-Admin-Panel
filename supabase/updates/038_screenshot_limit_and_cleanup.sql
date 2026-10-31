create or replace function public.is_trusted()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or coalesce(current_setting('app.trusted', true), '') = 'on'
    or coalesce(current_setting('role', true), '') = 'service_role';
$$;

update storage.buckets
set file_size_limit = 2 * 1024 * 1024
where id = 'screenshots';

create table if not exists public.upload_problems (
  id bigint generated always as identity primary key,
  customer_id uuid not null default auth.uid() references public.customers (id) on delete cascade,
  reason text not null,
  browser text not null,
  created_at timestamptz not null default now()
);

alter table public.upload_problems enable row level security;

drop policy if exists "customer adds own upload problem" on public.upload_problems;
create policy "customer adds own upload problem" on public.upload_problems
for insert to authenticated with check (customer_id = auth.uid());

drop policy if exists "admin reads upload problems" on public.upload_problems;
create policy "admin reads upload problems" on public.upload_problems
for select to authenticated using (public.is_admin());
