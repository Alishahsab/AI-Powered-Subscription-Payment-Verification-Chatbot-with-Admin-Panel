create extension if not exists pg_cron;

select cron.unschedule('cleanup-old-chat')
where exists (select 1 from cron.job where jobname = 'cleanup-old-chat');

select cron.schedule(
  'cleanup-old-chat',
  '15 22 * * *',
  $$
  delete from public.messages m
  where m.created_at < (extract(epoch from now()) * 1000)::bigint - 15::bigint * 24 * 60 * 60 * 1000
    and not exists (select 1 from public.orders o where o.customer_id = m.customer_id and o.code_unused);
  $$
);
