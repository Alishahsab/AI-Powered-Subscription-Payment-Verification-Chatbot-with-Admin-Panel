-- Deletes chat messages older than 15 days, every night at 03:15 Pakistan time (22:15 UTC).
-- Orders, tickets and customers are kept; only the chat history goes.
create extension if not exists pg_cron;

select cron.unschedule('cleanup-old-chat')
where exists (select 1 from cron.job where jobname = 'cleanup-old-chat');

select cron.schedule(
  'cleanup-old-chat',
  '15 22 * * *',
  $$
  delete from public.messages
  where created_at < (extract(epoch from now()) * 1000)::bigint - 15::bigint * 24 * 60 * 60 * 1000;
  $$
);
