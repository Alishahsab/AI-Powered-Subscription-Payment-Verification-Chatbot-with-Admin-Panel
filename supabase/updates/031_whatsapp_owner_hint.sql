create or replace function public.whatsapp_owner(check_number text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when length(name) <= 4 then left(name, 1)
           else left(name, 3)
         end || '*****' || right(name, 1) || '@' || domain
  from (
    select split_part(email, '@', 1) as name, split_part(email, '@', 2) as domain
    from public.customers
    where whatsapp = trim(check_number)
      and id is distinct from auth.uid()
    limit 1
  ) owner;
$$;

revoke all on function public.whatsapp_owner(text) from public;
grant execute on function public.whatsapp_owner(text) to anon, authenticated;
