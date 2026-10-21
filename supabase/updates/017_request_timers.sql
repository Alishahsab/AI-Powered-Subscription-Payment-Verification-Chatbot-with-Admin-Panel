-- Request timers, checked every minute.
-- * App issue: the "Close a support request after no reply for" timer starts when the admin replies.
--   If the customer neither taps Resolved nor answers before it ends, the request is closed.
--   Only opening the chat does not restart it.
-- * Payment issue: when "Wait after a payment problem" ends (or the admin lifts the wait),
--   the old payment issue is closed, so a new report never shows next to an old one.
-- Safe to run more than once.

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
  -- Payment issues end with their wait, whatever the admin status.
  update public.tickets t
  set status = 'resolved'
  from public.customers c
  where t.kind = 'payment' and t.status = 'open' and c.id = t.customer_id
    and (c.payment_blocked_until is null or c.payment_blocked_until <= now_ms);
  get diagnostics closed = row_count;

  if public.effective_status() <> 'active' then return closed; end if;

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

select cron.schedule('close-idle-requests', '* * * * *', $$ select public.close_idle_requests(); $$);
