alter table public.customers add column if not exists whatsapp text;

alter table public.customers drop constraint if exists customers_whatsapp_format;
alter table public.customers add constraint customers_whatsapp_format check (whatsapp is null or whatsapp ~ '^03[0-9]{9}$');

create unique index if not exists customers_whatsapp_unique on public.customers (whatsapp) where whatsapp is not null;

create or replace function public.whatsapp_taken(check_number text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers
    where whatsapp = trim(check_number)
      and id is distinct from auth.uid()
  );
$$;

revoke all on function public.whatsapp_taken(text) from public;
grant execute on function public.whatsapp_taken(text) to anon, authenticated;
