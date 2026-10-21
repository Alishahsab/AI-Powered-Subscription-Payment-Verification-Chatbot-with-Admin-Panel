-- App issues and payment issues are separate.
-- * App issues ("support") are taken while the admin is Active or Away (accepting).
-- * Only the admin closes a payment issue.
-- * Every 10 minutes the server closes app issues that waited too long
--   ("Close a support request after no reply for" in Settings), even when no page is open.
-- Safe to run more than once.

create or replace function public.guard_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted() then return new; end if;

  if tg_op = 'INSERT' then
    if exists (select 1 from public.customers where id = new.customer_id and blocked) then raise exception 'This account cannot send requests'; end if;
    if new.kind not in ('support', 'payment') then raise exception 'Not allowed'; end if;
    if length(new.message) > 1000 then raise exception 'Message is too long'; end if;
    if new.screenshot is not null and new.screenshot not like (new.customer_id::text || '/%') then raise exception 'Invalid image'; end if;
    if new.kind = 'support' then
      if public.effective_status() not in ('active', 'away') then raise exception 'New requests are closed right now'; end if;
      if exists (select 1 from public.tickets where customer_id = new.customer_id and kind = 'support' and status = 'open') then
        raise exception 'You already have an open request';
      end if;
    end if;
    if (select count(*) from public.tickets where customer_id = new.customer_id and inserted_at > now() - interval '1 hour') >= 6 then
      raise exception 'Too many requests, please try again later';
    end if;
    new.status := 'open';
    return new;
  end if;

  -- Customers may only close their own app issue.
  new.id := old.id;
  new.customer_id := old.customer_id;
  new.kind := old.kind;
  new.message := old.message;
  new.screenshot := old.screenshot;
  new.order_id := old.order_id;
  new.created_at := old.created_at;
  new.inserted_at := old.inserted_at;
  if new.status <> 'resolved' or old.kind = 'payment' then new.status := old.status; end if;
  return new;
end;
$$;

-- Closes app issues that have waited too long, while the admin is Active.
--   No admin reply since the request was sent  -> "issueClosedNoReply"
--   Admin replied, customer went quiet after it -> "issueAutoResolved"
create or replace function public.close_idle_requests()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  settings jsonb := public.store_settings();
  now_ms bigint := public.now_ms();
  idle_ms bigint := public.setting_minutes('issueInactiveMinutes', 360) * 60000;
  request record;
  admin_reply bigint;
  last_seen bigint;
  message_key text;
  message_text text;
  closed int := 0;
begin
  if public.effective_status() <> 'active' then return 0; end if;

  for request in select * from public.tickets where kind = 'support' and status = 'open' loop
    select max(created_at) into admin_reply
    from public.messages
    where customer_id = request.customer_id and sender = 'admin' and created_at > request.created_at;

    if admin_reply is null then
      if now_ms - request.created_at <= idle_ms then continue; end if;
      message_key := 'issueClosedNoReply';
      message_text := coalesce(settings -> 'messages' ->> message_key,
        'Our admin is not available right now, so your request {ticket_id} has been closed. You can send a new one from Customer Support.');
    else
      select last_seen_at into last_seen from public.customers where id = request.customer_id;
      if now_ms - greatest(admin_reply, coalesce(last_seen, 0)) <= idle_ms then continue; end if;
      message_key := 'issueAutoResolved';
      message_text := coalesce(settings -> 'messages' ->> message_key,
        'Your request {ticket_id} has been resolved because there was no reply for a while. If you still need help, choose Customer Support from the menu.');
    end if;

    update public.tickets set status = 'resolved' where id = request.id;
    insert into public.messages (id, customer_id, sender, kind, text, created_at)
    values ('srv-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), request.customer_id, 'bot', 'text',
            replace(message_text, '{ticket_id}', request.id), now_ms);
    update public.conversations
    set stage = 'menu', last_message_at = now_ms
    where customer_id = request.customer_id and stage in ('waiting_agent', 'agent_replied', 'live');
    closed := closed + 1;
  end loop;

  return closed;
end;
$$;

revoke all on function public.close_idle_requests() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.unschedule('close-idle-requests')
where exists (select 1 from cron.job where jobname = 'close-idle-requests');

select cron.schedule('close-idle-requests', '*/10 * * * *', $$ select public.close_idle_requests(); $$);
