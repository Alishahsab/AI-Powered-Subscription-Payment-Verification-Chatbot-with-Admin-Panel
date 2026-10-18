alter table public.orders add column if not exists bank_name text;
alter table public.orders add column if not exists account_title text;
alter table public.orders add column if not exists account_number text;

alter table public.customers add column if not exists cancel_count int not null default 0;
alter table public.customers add column if not exists cancel_cooldown_until bigint;
alter table public.orders add column if not exists payment_steps text;
