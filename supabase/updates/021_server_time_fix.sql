-- Every message, ticket and notification gets the server's time, so a phone with a wrong clock
-- cannot show wrong times. Run this one even if 020 was never run; it sets up everything.
create or replace function public.set_server_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  latest bigint;
begin
  if tg_table_name = 'messages' then
    -- Messages saved in the same moment keep their order. Only the last few seconds count, so an
    -- old message saved with a phone clock set ahead cannot push new messages into the future.
    select max(created_at) into latest from public.messages
    where customer_id = new.customer_id and created_at between now_ms - 5000 and now_ms + 5000;
    new.created_at := greatest(now_ms, coalesce(latest, 0) + 1);
  else
    new.created_at := now_ms;
  end if;
  return new;
end;
$$;

drop trigger if exists set_server_time on public.messages;
create trigger set_server_time
before insert on public.messages
for each row execute function public.set_server_time();

drop trigger if exists set_server_time on public.tickets;
create trigger set_server_time
before insert on public.tickets
for each row execute function public.set_server_time();

drop trigger if exists set_server_time on public.notifications;
create trigger set_server_time
before insert on public.notifications
for each row execute function public.set_server_time();
