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
  if today > block_count then
    update public.customers
    set blocked = true, block_reason = 'Too many cancelled orders'
    where id = new.customer_id and not blocked;
  elsif recent >= limit_count then
    update public.customers
    set cancel_cooldown_until = greatest(coalesce(cancel_cooldown_until, 0), now_ms + public.setting_minutes('cancelCooldownMinutes', 30) * 60000)
    where id = new.customer_id;
  end if;
  perform public.set_trusted(false);
  return null;
end;
$$;
