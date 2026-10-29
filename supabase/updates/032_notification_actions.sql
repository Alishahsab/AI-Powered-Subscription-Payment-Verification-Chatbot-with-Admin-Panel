create or replace function public.admin_approve_order(order_id text, code_message text, code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order public.orders;
  now_ms bigint := public.now_ms();
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve orders';
  end if;
  if code is null or code !~ '^[A-Za-z0-9]{6}$' then
    return 'no_code';
  end if;

  select * into found_order from public.orders o where o.id = admin_approve_order.order_id for update;
  if not found then
    return 'missing';
  end if;
  if found_order.status not in ('pending_review', 'rejected') then
    return 'already_done';
  end if;
  if exists (select 1 from public.orders o where lower(o.code) = lower(admin_approve_order.code))
    or exists (
      select 1 from public.messages m
      where m.sender = 'admin' and m.kind <> 'deleted' and m.text ~* ('\m' || admin_approve_order.code || '\M')
    ) then
    return 'code_used';
  end if;

  update public.orders o
  set status = 'completed', reviewed_at = now_ms, code = admin_approve_order.code, code_unused = false
  where o.id = found_order.id;

  insert into public.messages (id, customer_id, sender, kind, text, order_id, created_at)
  values (substr(md5(random()::text || clock_timestamp()::text), 1, 14), found_order.customer_id, 'admin', 'code', code_message, found_order.id, now_ms);

  update public.conversations c
  set active_order_id = case when c.active_order_id = found_order.id then null else c.active_order_id end,
      stage = 'code_delivered',
      unread_by_admin = 0,
      last_message_at = now_ms
  where c.customer_id = found_order.customer_id;

  update public.notifications n set read = true where n.customer_id = found_order.customer_id;
  return 'approved';
end;
$$;

create or replace function public.admin_cancel_order(order_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_order public.orders;
  now_ms bigint := public.now_ms();
  settings jsonb := public.store_settings();
  bot_text text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can cancel orders';
  end if;

  select * into found_order from public.orders o where o.id = admin_cancel_order.order_id for update;
  if not found then
    return 'missing';
  end if;
  if found_order.status not in ('pending_review', 'rejected') then
    return 'already_done';
  end if;

  bot_text := replace(
    coalesce(settings -> 'messages' ->> 'orderCancelledByAdmin', 'Your order {order_id} has been cancelled by our team. You can create a new order from the main menu.'),
    '{order_id}', found_order.id
  );

  update public.orders o
  set status = 'cancelled', reject_reason = 'Cancelled by admin', reviewed_at = now_ms
  where o.id = found_order.id;

  insert into public.messages (id, customer_id, sender, kind, text, created_at)
  values (substr(md5(random()::text || clock_timestamp()::text), 1, 14), found_order.customer_id, 'bot', 'text', bot_text, now_ms);

  update public.conversations c
  set active_order_id = case when c.active_order_id = found_order.id then null else c.active_order_id end,
      stage = 'menu',
      unread_by_admin = 0,
      last_message_at = now_ms
  where c.customer_id = found_order.customer_id;

  update public.notifications n set read = true where n.customer_id = found_order.customer_id;
  return 'cancelled';
end;
$$;

revoke all on function public.admin_approve_order(text, text, text) from public;
revoke all on function public.admin_cancel_order(text) from public;
grant execute on function public.admin_approve_order(text, text, text) to authenticated;
grant execute on function public.admin_cancel_order(text) to authenticated;
