create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

alter table public.customers add column if not exists updated_at timestamptz not null default now();
alter table public.conversations add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.messages add column if not exists updated_at timestamptz not null default now();
alter table public.tickets add column if not exists updated_at timestamptz not null default now();
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

create index if not exists customers_updated_at on public.customers (updated_at);
create index if not exists conversations_updated_at on public.conversations (updated_at);
create index if not exists orders_updated_at on public.orders (updated_at);
create index if not exists messages_updated_at on public.messages (updated_at);
create index if not exists tickets_updated_at on public.tickets (updated_at);
create index if not exists notifications_updated_at on public.notifications (updated_at);

drop trigger if exists zz_set_updated_at on public.store_config;
create trigger zz_set_updated_at before insert or update on public.store_config for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.customers;
create trigger zz_set_updated_at before insert or update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.conversations;
create trigger zz_set_updated_at before insert or update on public.conversations for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.orders;
create trigger zz_set_updated_at before insert or update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.messages;
create trigger zz_set_updated_at before insert or update on public.messages for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.tickets;
create trigger zz_set_updated_at before insert or update on public.tickets for each row execute function public.set_updated_at();

drop trigger if exists zz_set_updated_at on public.notifications;
create trigger zz_set_updated_at before insert or update on public.notifications for each row execute function public.set_updated_at();
