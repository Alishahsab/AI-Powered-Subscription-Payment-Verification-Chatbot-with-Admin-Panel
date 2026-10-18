alter table public.customers add column if not exists block_reason text;

create or replace function public.protect_customer_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.customer_number := old.customer_number;
  if not public.is_admin() then
    new.blocked := old.blocked;
    new.block_reason := old.block_reason;
  end if;
  return new;
end;
$$;

drop policy if exists "admin uploads screenshots" on storage.objects;
create policy "admin uploads screenshots" on storage.objects
for insert to authenticated
with check (bucket_id = 'screenshots' and public.is_admin());
