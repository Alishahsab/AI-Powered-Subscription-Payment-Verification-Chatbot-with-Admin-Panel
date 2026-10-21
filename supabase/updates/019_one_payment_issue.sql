create or replace function public.apply_payment_pause()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ms bigint := public.now_ms();
begin
  if new.kind <> 'payment' then return null; end if;

  if tg_op = 'INSERT' and not public.is_admin() then
    -- One payment issue at a time: a new report closes the customer's older open ones first.
    -- (Closing one lifts the wait, so the new wait is set after it.)
    perform public.set_trusted(true);
    update public.tickets set status = 'resolved'
    where customer_id = new.customer_id and kind = 'payment' and status = 'open' and id <> new.id;
    perform public.set_trusted(true);
    update public.customers
    set payment_blocked_until = greatest(coalesce(payment_blocked_until, 0), now_ms + public.setting_minutes('retryMinutes', 30) * 60000)
    where id = new.customer_id;
    perform public.set_trusted(false);
  elsif tg_op = 'UPDATE' and old.status = 'open' and new.status = 'resolved' then
    perform public.set_trusted(true);
    update public.customers set payment_blocked_until = null where id = new.customer_id;
    perform public.set_trusted(false);
  end if;
  return null;
end;
$$;

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
  customer_reply bigint;
  message_key text;
  message_text text;
  closed int := 0;
begin
  -- Each payment issue ends when its own wait ends (counted from when the server received it),
  -- whatever the admin status. Trusted mode lets the server change a payment issue's status.
  perform public.set_trusted(true);
  update public.tickets
  set status = 'resolved'
  where kind = 'payment' and status = 'open'
    and (extract(epoch from inserted_at) * 1000)::bigint + public.setting_minutes('retryMinutes', 30) * 60000 <= now_ms;
  get diagnostics closed = row_count;
  perform public.set_trusted(false);

  if public.effective_status() <> 'active' then return closed; end if;

  for request in select * from public.tickets where kind = 'support' and status = 'open' loop
    select max(created_at) into admin_reply
    from public.messages
    where customer_id = request.customer_id and sender = 'admin' and created_at > request.created_at;

    -- The timer starts only when the admin replies; a request without a reply stays open for the admin.
    if admin_reply is null then continue; end if;

    -- The customer answered after the admin (Still facing the issue, then a message): it is the admin's turn.
    -- Tapping elsewhere in the menu does not count as an answer.
    select max(created_at) into customer_reply
    from public.messages
    where customer_id = request.customer_id and sender = 'customer' and created_at > admin_reply;
    if customer_reply is not null and exists (
      select 1 from public.conversations where customer_id = request.customer_id and stage in ('live', 'waiting_agent')
    ) then continue; end if;
    if now_ms - admin_reply <= idle_ms then continue; end if;
    message_key := 'issueAutoResolved';
    message_text := coalesce(settings -> 'messages' ->> message_key,
      'Your request {ticket_id} has been resolved because there was no reply for a while. If you still need help, choose Customer Support from the menu.');

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

select cron.schedule('close-idle-requests', '* * * * *', $$ select public.close_idle_requests(); $$);
