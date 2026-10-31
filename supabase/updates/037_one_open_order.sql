create or replace function public.guard_one_open_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted() then return new; end if;
  if exists (select 1 from public.orders where customer_id = new.customer_id and status = 'awaiting_payment') then
    raise exception 'There is already an open order';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_one_open_order on public.orders;
create trigger guard_one_open_order
before insert on public.orders
for each row execute function public.guard_one_open_order();
