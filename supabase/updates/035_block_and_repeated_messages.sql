create or replace function public.apply_cancel_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ms bigint := public.now_ms();
  settings jsonb := public.store_settings();
  window_ms bigint := public.setting_minutes('cancelWindowMinutes', 5) * 60000;
  limit_count int := coalesce((settings -> 'limits' ->> 'cancelsBeforeCooldown')::int, 2);
  block_count int := coalesce((settings -> 'limits' ->> 'cancelsBeforeBlock')::int, 3);
  reason_text text := 'Too many cancelled orders';
  block_message text := coalesce(settings -> 'blocking' ->> 'message', 'Your access has been restricted. Please contact us by email.');
  cancelled_message text := coalesce(settings -> 'messages' ->> 'orderCancelled', 'Your order has been cancelled. Anything else we can help with?');
  customer_title text;
  recent int;
  today int;
begin
  if public.is_admin() then return null; end if;
  if not (old.status = 'awaiting_payment' and new.status = 'cancelled') then return null; end if;

  select count(*) into recent
  from public.orders
  where customer_id = new.customer_id
    and status = 'cancelled'
    and coalesce(reject_reason, '') <> 'Cancelled by admin'
    and reviewed_at >= now_ms - window_ms;

  select count(*) into today
  from public.orders
  where customer_id = new.customer_id
    and status = 'cancelled'
    and coalesce(reject_reason, '') <> 'Cancelled by admin'
    and reviewed_at >= now_ms - 24 * 60 * 60000;

  perform public.set_trusted(true);
  if today >= block_count then
    update public.customers
    set blocked = true, block_reason = reason_text
    where id = new.customer_id and not blocked
    returning coalesce(whatsapp, email) into customer_title;

    if customer_title is not null then
      insert into public.messages (id, customer_id, sender, kind, text, created_at)
      values
        (replace(gen_random_uuid()::text, '-', ''), new.customer_id, 'customer', 'text', 'I don''t want to continue this order', now_ms),
        (replace(gen_random_uuid()::text, '-', ''), new.customer_id, 'bot', 'text', cancelled_message, now_ms),
        (replace(gen_random_uuid()::text, '-', ''), new.customer_id, 'admin', 'text', block_message || E'\nReason: ' || reason_text, now_ms);

      update public.conversations
      set stage = 'menu', active_order_id = null, last_message_at = now_ms
      where customer_id = new.customer_id;

      insert into public.notifications (id, kind, title, body, customer_id, created_at)
      values (replace(gen_random_uuid()::text, '-', ''), 'blocked', 'Customer blocked', customer_title || ' · ' || reason_text, new.customer_id, now_ms);
    end if;
  elsif recent >= limit_count then
    update public.customers
    set cancel_cooldown_until = greatest(coalesce(cancel_cooldown_until, 0), now_ms + public.setting_minutes('cancelCooldownMinutes', 30) * 60000)
    where id = new.customer_id;
  end if;
  perform public.set_trusted(false);
  return null;
end;
$$;

create or replace function public.skip_repeated_bot_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender = 'bot' and new.kind = 'text' and exists (
    select 1 from public.messages
    where customer_id = new.customer_id
      and sender = 'bot'
      and text = new.text
      and created_at >= public.now_ms() - 60000
  ) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists skip_repeated_bot_message on public.messages;
create trigger skip_repeated_bot_message
before insert on public.messages
for each row execute function public.skip_repeated_bot_message();
