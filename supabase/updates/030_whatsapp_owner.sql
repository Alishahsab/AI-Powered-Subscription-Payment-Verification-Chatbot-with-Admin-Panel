create or replace function public.whatsapp_owner(check_number text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when length(split_part(email, '@', 1)) <= 2 then left(email, 1)
           else left(email, 2)
         end || '*****@' || split_part(email, '@', 2)
  from public.customers
  where whatsapp = trim(check_number)
    and id is distinct from auth.uid()
  limit 1;
$$;

revoke all on function public.whatsapp_owner(text) from public;
grant execute on function public.whatsapp_owner(text) to anon, authenticated;
