alter table public.customers add column if not exists blocked_at bigint;

create or replace function public.set_blocked_at()
returns trigger
language plpgsql
as $$
begin
  if not new.blocked then
    new.blocked_at := null;
  elsif tg_op = 'INSERT' or not old.blocked then
    new.blocked_at := public.now_ms();
  else
    new.blocked_at := old.blocked_at;
  end if;
  return new;
end;
$$;

drop trigger if exists set_blocked_at on public.customers;
create trigger set_blocked_at
before insert or update on public.customers
for each row execute function public.set_blocked_at();
