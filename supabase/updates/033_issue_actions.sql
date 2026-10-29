create or replace function public.admin_resolve_ticket(ticket_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_ticket public.tickets;
  now_ms bigint := public.now_ms();
  settings jsonb := public.store_settings();
  bot_text text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can resolve requests';
  end if;

  select * into found_ticket from public.tickets t where t.id = admin_resolve_ticket.ticket_id for update;
  if not found then
    return 'missing';
  end if;
  if found_ticket.kind <> 'support' then
    return 'not_support';
  end if;
  if found_ticket.status <> 'open' then
    return 'already_done';
  end if;

  bot_text := replace(
    coalesce(settings -> 'messages' ->> 'issueResolvedByAdmin', 'Your request {ticket_id} has been marked as resolved. If you need anything else, choose Customer Support from the menu.'),
    '{ticket_id}', found_ticket.id
  );

  update public.tickets t set status = 'resolved' where t.id = found_ticket.id;

  insert into public.messages (id, customer_id, sender, kind, text, created_at)
  values (substr(md5(random()::text || clock_timestamp()::text), 1, 14), found_ticket.customer_id, 'bot', 'text', bot_text, now_ms);

  update public.conversations c
  set stage = case when c.stage in ('waiting_agent', 'agent_replied', 'live') then 'menu' else c.stage end,
      last_message_at = now_ms
  where c.customer_id = found_ticket.customer_id;

  return 'resolved';
end;
$$;

create or replace function public.admin_reply(customer_id uuid, reply text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ms bigint := public.now_ms();
begin
  if not public.is_admin() then
    raise exception 'Only admins can reply';
  end if;
  if coalesce(trim(reply), '') = '' then
    return 'empty';
  end if;

  insert into public.messages (id, customer_id, sender, kind, text, created_at)
  values (substr(md5(random()::text || clock_timestamp()::text), 1, 14), admin_reply.customer_id, 'admin', 'text', trim(reply), now_ms);

  update public.conversations c
  set unread_by_admin = 0,
      stage = case
        when exists (select 1 from public.tickets t where t.customer_id = admin_reply.customer_id and t.kind = 'support' and t.status = 'open') then 'agent_replied'
        else c.stage
      end,
      last_message_at = now_ms
  where c.customer_id = admin_reply.customer_id;

  update public.notifications n set read = true where n.customer_id = admin_reply.customer_id;
  return 'sent';
end;
$$;

revoke all on function public.admin_resolve_ticket(text) from public;
revoke all on function public.admin_reply(uuid, text) from public;
grant execute on function public.admin_resolve_ticket(text) to authenticated;
grant execute on function public.admin_reply(uuid, text) to authenticated;
