create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('cleanup-screenshots')
where exists (select 1 from cron.job where jobname = 'cleanup-screenshots');

select cron.schedule(
  'cleanup-screenshots',
  '0 22 * * *',
  $$
  select net.http_post(
    url := 'https://ejfeohxicmbwwkefurst.supabase.co/functions/v1/cleanup-screenshots',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
