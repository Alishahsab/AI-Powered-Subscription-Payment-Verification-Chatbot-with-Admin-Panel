create or replace function public.expire_unpaid_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  settings jsonb := public.store_settings();
  now_ms bigint := public.now_ms();
  grace bigint := 2 * 60 * 1000;
  message_text text := coalesce(settings -> 'messages' ->> 'orderExpired',
    'Order {order_id} has been cancelled because the payment time ran out. If you still want to buy, please start again from the main menu.');
  expired_order record;
  expired int := 0;
begin
  perform public.set_trusted(true);

  for expired_order in
    update public.orders
    set status = 'expired'
    where status = 'awaiting_payment' and expires_at + grace <= now_ms
    returning id, customer_id
  loop
    expired := expired + 1;

    update public.conversations
    set active_order_id = null, stage = 'menu', last_message_at = now_ms
    where customer_id = expired_order.customer_id and active_order_id = expired_order.id;

    if found then
      insert into public.messages (id, customer_id, sender, kind, text, created_at)
      values ('srv-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), expired_order.customer_id, 'bot', 'text',
              replace(message_text, '{order_id}', expired_order.id), now_ms);
    end if;
  end loop;

  perform public.set_trusted(false);
  return expired;
end;
$$;

revoke all on function public.expire_unpaid_orders() from public, anon, authenticated;

-- Only an unpaid order can expire, whoever asks, the admin included.
create or replace function public.guard_order_expiry()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'expired' and old.status not in ('awaiting_payment', 'expired') then
    raise exception 'Only an unpaid order can expire';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_order_expiry on public.orders;
create trigger guard_order_expiry
before update on public.orders
for each row execute function public.guard_order_expiry();

create extension if not exists pg_cron;

select cron.unschedule('expire-unpaid-orders')
where exists (select 1 from cron.job where jobname = 'expire-unpaid-orders');

select cron.schedule('expire-unpaid-orders', '* * * * *', $$ select public.expire_unpaid_orders(); $$);
