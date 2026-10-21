-- The panel right after sending a request confirms it; the "already open" wording is only for a second attempt.
update public.store_config
set settings = jsonb_set(settings, '{support,waitingMessage}', '"Your request is submitted. Our admin will reply here soon."')
where id = 1
  and settings -> 'support' ->> 'waitingMessage' = 'You already have an open request. Please wait for our reply.';
