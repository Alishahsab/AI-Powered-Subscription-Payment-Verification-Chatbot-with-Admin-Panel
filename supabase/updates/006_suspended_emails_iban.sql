create table if not exists public.suspended_emails (
  email text primary key,
  suspended_at timestamptz not null default now()
);

alter table public.suspended_emails enable row level security;

drop policy if exists "admin reads suspended emails" on public.suspended_emails;
create policy "admin reads suspended emails" on public.suspended_emails
for select to authenticated using (public.is_admin());

create or replace function public.email_status(check_email text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when exists (select 1 from public.suspended_emails where email = lower(trim(check_email))) then 'suspended'
    when exists (select 1 from auth.users where lower(email) = lower(trim(check_email))) then 'registered'
    else 'new'
  end;
$$;

revoke all on function public.email_status(text) from public;
grant execute on function public.email_status(text) to anon, authenticated;

create or replace function public.delete_customer(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete customers';
  end if;
  if exists (select 1 from public.admins where user_id = target) then
    raise exception 'Admin accounts cannot be deleted here';
  end if;
  insert into public.suspended_emails (email)
  select lower(email) from auth.users where id = target and email is not null
  on conflict (email) do nothing;
  delete from auth.users where id = target;
end;
$$;

create or replace function public.block_suspended_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.suspended_emails where email = lower(new.email)) then
    raise exception 'This email can no longer be used to create an account';
  end if;
  return new;
end;
$$;

drop trigger if exists block_suspended_signup on auth.users;
create trigger block_suspended_signup
before insert on auth.users
for each row execute function public.block_suspended_signup();

alter table public.orders add column if not exists iban text;
