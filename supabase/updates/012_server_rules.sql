-- Server-side rules. The browser can no longer skip cooldowns, change prices,
-- fake admin messages or edit what was already sent. Admins are not limited.
-- Safe to run more than once.

-- ---------- helpers ----------

create or replace function public.now_ms()
returns bigint
language sql
stable
as $$
  select (extract(epoch from now()) * 1000)::bigint;
$$;

-- Admins, and the server itself while it applies a rule, may write freely.
create or replace function public.is_trusted()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or coalesce(current_setting('app.trusted', true), '') = 'on';
$$;

create or replace function public.store_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select settings from public.store_config where id = 1;
$$;

create or replace function public.setting_minutes(timer text, fallback int)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((public.store_settings() -> 'timers' ->> timer)::bigint, fallback);
$$;

-- Same rule as the app: offline wins, then working hours (Pakistan time), then the chosen status.
create or replace function public.effective_status()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  settings jsonb := public.store_settings();
  local_time time := (now() at time zone 'Asia/Karachi')::time;
  opens time;
  closes time;
  open_now boolean;
begin
  if settings is null then return 'active'; end if;
  if settings ->> 'status' = 'offline' then return 'offline'; end if;
  if coalesce((settings -> 'hours' ->> 'enforce')::boolean, false) then
    opens := (settings -> 'hours' ->> 'start')::time;
    closes := (settings -> 'hours' ->> 'end')::time;
    open_now := case when opens <= closes then local_time >= opens and local_time < closes else local_time >= opens or local_time < closes end;
    if not open_now then return 'offline'; end if;
  end if;
  return coalesce(settings ->> 'status', 'active');
end;
$$;

create or replace function public.set_trusted(enabled boolean)
returns void
language plpgsql
as $$
begin
  perform set_config('app.trusted', case when enabled then 'on' else 'off' end, true);
end;
$$;

revoke all on function public.set_trusted(boolean) from public, anon, authenticated;

-- Server write time, used for rate limits (created_at comes from the browser).
alter table public.messages add column if not exists inserted_at timestamptz not null default now();
alter table public.tickets add column if not exists inserted_at timestamptz not null default now();
alter table public.notifications add column if not exists inserted_at timestamptz not null default now();

-- ---------- customers ----------

create or replace function public.protect_customer_flags()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  now_ms bigint := public.now_ms();
begin
  if tg_op = 'INSERT' then
    if not public.is_trusted() then
      new.email := coalesce((select email from auth.users where id = new.id), new.email);
      new.blocked := false;
      new.block_reason := null;
      new.payment_blocked_until := null;
      new.cancel_cooldown_until := null;
      new.cancel_count := 0;
    end if;
    return new;
  end if;

  new.customer_number := old.customer_number;
  if public.is_trusted() then return new; end if;

  new.email := old.email;
  new.created_at := old.created_at;
  new.blocked := old.blocked;
  new.block_reason := old.block_reason;
  -- A customer can start a pause, never shorten one that is still running.
  if old.payment_blocked_until > now_ms and coalesce(new.payment_blocked_until, 0) < old.payment_blocked_until then
    new.payment_blocked_until := old.payment_blocked_until;
  end if;
  if old.cancel_cooldown_until > now_ms and coalesce(new.cancel_cooldown_until, 0) < old.cancel_cooldown_until then
    new.cancel_cooldown_until := old.cancel_cooldown_until;
  end if;
  if new.name is not null and length(new.name) > 60 then
    new.name := left(new.name, 60);
  end if;
  return new;
end;
$$;

drop trigger if exists protect_customer_flags on public.customers;
create trigger protect_customer_flags
before insert or update on public.customers
for each row execute function public.protect_customer_flags();

-- ---------- conversations ----------

create or replace function public.guard_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted() then return new; end if;
  if new.stage not in ('menu', 'choose_plan', 'choose_method', 'terms', 'awaiting_payment', 'support', 'support_other', 'rejected', 'waiting_agent', 'agent_replied', 'code_delivered', 'live') then
    raise exception 'Invalid stage';
  end if;
  if tg_op = 'INSERT' then
    new.unread_by_admin := least(greatest(new.unread_by_admin, 0), 1);
  else
    -- Only the admin clears the unread count.
    new.unread_by_admin := greatest(new.unread_by_admin, old.unread_by_admin);
    new.unread_by_admin := least(new.unread_by_admin, old.unread_by_admin + 5);
  end if;
  return new;
end;
$$;

drop trigger if exists guard_conversation on public.conversations;
create trigger guard_conversation
before insert or update on public.conversations
for each row execute function public.guard_conversation();

-- ---------- orders ----------

create or replace function public.guard_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ms bigint := public.now_ms();
  grace bigint := 2 * 60 * 1000;
  settings jsonb := public.store_settings();
  plan jsonb;
  method jsonb;
  customer public.customers%rowtype;
  status_now text;
begin
  if public.is_trusted() then return new; end if;

  if tg_op = 'INSERT' then
    select * into customer from public.customers where id = new.customer_id;
    if not found or customer.blocked then raise exception 'This account cannot place orders'; end if;
    if customer.cancel_cooldown_until > now_ms or customer.payment_blocked_until > now_ms then
      raise exception 'New orders are paused for this account';
    end if;
    if exists (select 1 from public.orders where customer_id = new.customer_id and (status in ('pending_review', 'rejected') or (status = 'awaiting_payment' and expires_at > now_ms))) then
      raise exception 'There is already an open order';
    end if;

    status_now := public.effective_status();
    if status_now in ('offline', 'away_closed') then raise exception 'Orders are closed right now'; end if;

    select value into plan from jsonb_array_elements((select plans from public.store_config where id = 1)) where value ->> 'id' = new.plan_id;
    if plan is null or not coalesce((plan ->> 'active')::boolean, true) then raise exception 'Unknown plan'; end if;
    select value into method from jsonb_array_elements((select methods from public.store_config where id = 1)) where value ->> 'name' = new.method_name;
    if method is null or not coalesce((method ->> 'active')::boolean, true) then raise exception 'Unknown payment method'; end if;

    -- Price, plan and account details always come from the store settings.
    new.plan_name := plan ->> 'name';
    new.amount := (plan ->> 'price')::int;
    new.bank_name := settings -> 'bank' ->> 'bankName';
    new.account_title := settings -> 'bank' ->> 'accountTitle';
    new.account_number := settings -> 'bank' ->> 'accountNumber';
    new.iban := case when coalesce((method ->> 'showIban')::boolean, false) then nullif(settings -> 'bank' ->> 'iban', '') end;
    new.payment_steps := method ->> 'steps';
    new.status := 'awaiting_payment';
    new.created_at := now_ms;
    new.expires_at := now_ms + public.setting_minutes('orderMinutes', 15) * 60000;
    new.submitted_at := null;
    new.reviewed_at := null;
    new.screenshot := null;
    new.sender_name := null;
    new.reject_reason := null;
    new.code := null;
    new.code_unused := false;
    return new;
  end if;

  -- Update: everything the customer cannot change is kept.
  new.id := old.id;
  new.customer_id := old.customer_id;
  new.plan_id := old.plan_id;
  new.plan_name := old.plan_name;
  new.amount := old.amount;
  new.method_name := old.method_name;
  new.bank_name := old.bank_name;
  new.account_title := old.account_title;
  new.account_number := old.account_number;
  new.iban := old.iban;
  new.payment_steps := old.payment_steps;
  new.created_at := old.created_at;
  new.expires_at := old.expires_at;
  new.code := old.code;
  new.code_unused := old.code_unused;

  if new.status = old.status then
    new.screenshot := old.screenshot;
    new.sender_name := old.sender_name;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := old.reject_reason;
    return new;
  end if;

  if old.status <> 'awaiting_payment' then raise exception 'This order can no longer be changed'; end if;

  if new.status = 'cancelled' then
    new.reviewed_at := now_ms;
    new.screenshot := old.screenshot;
    new.sender_name := old.sender_name;
    new.submitted_at := old.submitted_at;
    new.reject_reason := old.reject_reason;
  elsif new.status = 'pending_review' then
    if old.expires_at + grace < now_ms then raise exception 'This order has expired'; end if;
    if new.screenshot is null or new.screenshot not like (old.customer_id::text || '/%') then raise exception 'A payment screenshot is required'; end if;
    if new.sender_name is null or length(trim(new.sender_name)) < 2 or length(new.sender_name) > 60 then raise exception 'Sender name is required'; end if;
    new.submitted_at := now_ms;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := null;
  elsif new.status = 'issue_reported' then
    new.screenshot := old.screenshot;
    new.sender_name := old.sender_name;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := old.reject_reason;
  elsif new.status = 'expired' then
    if old.expires_at > now_ms + grace then raise exception 'This order has not expired yet'; end if;
    new.screenshot := old.screenshot;
    new.sender_name := old.sender_name;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := old.reject_reason;
  else
    raise exception 'This order change is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_order on public.orders;
create trigger guard_order
before insert or update on public.orders
for each row execute function public.guard_order();

-- Cancelling too many orders in a short time pauses new orders, decided by the server.
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
  recent int;
begin
  if public.is_admin() then return null; end if;
  if not (old.status = 'awaiting_payment' and new.status = 'cancelled') then return null; end if;

  select count(*) into recent
  from public.orders
  where customer_id = new.customer_id
    and status = 'cancelled'
    and coalesce(reject_reason, '') <> 'Cancelled by admin'
    and reviewed_at >= now_ms - window_ms;

  if recent >= limit_count then
    perform public.set_trusted(true);
    update public.customers
    set cancel_cooldown_until = greatest(coalesce(cancel_cooldown_until, 0), now_ms + public.setting_minutes('cancelCooldownMinutes', 30) * 60000)
    where id = new.customer_id;
    perform public.set_trusted(false);
  end if;
  return null;
end;
$$;

drop trigger if exists apply_cancel_cooldown on public.orders;
create trigger apply_cancel_cooldown
after update on public.orders
for each row execute function public.apply_cancel_cooldown();

-- ---------- messages ----------

create or replace function public.guard_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted() then return new; end if;

  if tg_op = 'INSERT' then
    if new.sender not in ('customer', 'bot') then raise exception 'Not allowed'; end if;
    if exists (select 1 from public.customers where id = new.customer_id and blocked) then raise exception 'This account is blocked'; end if;
    if new.kind not in ('text', 'payment', 'steps', 'proof', 'image', 'instructions') then raise exception 'Not allowed'; end if;
    if length(new.text) > 2000 then raise exception 'Message is too long'; end if;
    if new.image is not null and new.image not like (new.customer_id::text || '/%') then raise exception 'Invalid image'; end if;
    new.emailed_to := null;
    new.delivered_at := null;
    new.seen_at := null;
    if (select count(*) from public.messages where customer_id = new.customer_id and sender <> 'admin' and inserted_at > now() - interval '1 minute') >= 40 then
      raise exception 'Too many messages, please slow down';
    end if;
    return new;
  end if;

  -- Customers may only mark messages as delivered or seen.
  new.id := old.id;
  new.customer_id := old.customer_id;
  new.sender := old.sender;
  new.kind := old.kind;
  new.text := old.text;
  new.order_id := old.order_id;
  new.image := old.image;
  new.emailed_to := old.emailed_to;
  new.created_at := old.created_at;
  new.inserted_at := old.inserted_at;
  return new;
end;
$$;

drop trigger if exists guard_message on public.messages;
create trigger guard_message
before insert or update on public.messages
for each row execute function public.guard_message();

-- ---------- tickets ----------

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
      if public.effective_status() <> 'active' then raise exception 'New requests are closed right now'; end if;
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

  -- Customers may only close their own request.
  new.id := old.id;
  new.customer_id := old.customer_id;
  new.kind := old.kind;
  new.message := old.message;
  new.screenshot := old.screenshot;
  new.order_id := old.order_id;
  new.created_at := old.created_at;
  new.inserted_at := old.inserted_at;
  if new.status <> 'resolved' then new.status := old.status; end if;
  return new;
end;
$$;

drop trigger if exists guard_ticket on public.tickets;
create trigger guard_ticket
before insert or update on public.tickets
for each row execute function public.guard_ticket();

-- A payment problem pauses new orders; resolving it lifts the pause. Decided by the server.
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

drop trigger if exists apply_payment_pause on public.tickets;
create trigger apply_payment_pause
after insert or update on public.tickets
for each row execute function public.apply_payment_pause();

-- ---------- notifications ----------

create or replace function public.guard_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted() then return new; end if;
  if new.kind not in ('payment', 'payment_issue', 'support') then raise exception 'Not allowed'; end if;
  new.title := left(new.title, 120);
  new.body := left(new.body, 300);
  new.read := false;
  if (select count(*) from public.notifications where customer_id = new.customer_id and inserted_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many notifications';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_notification on public.notifications;
create trigger guard_notification
before insert on public.notifications
for each row execute function public.guard_notification();

-- ---------- storage ----------

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('screenshots', 'guides');
