-- Customers are no longer deleted from the admin panel, so emails are never suspended.
drop trigger if exists block_suspended_signup on auth.users;
drop function if exists public.block_suspended_signup();
drop function if exists public.delete_customer(uuid);

create or replace function public.email_status(check_email text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when exists (select 1 from auth.users where lower(email) = lower(trim(check_email))) then 'registered'
    else 'new'
  end;
$$;

drop table if exists public.suspended_emails;
