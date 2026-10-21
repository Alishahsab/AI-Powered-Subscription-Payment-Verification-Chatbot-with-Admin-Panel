-- Open-request wording without the request number, in the saved settings.
update public.store_config
set settings = replace(
  replace(settings::text,
    'You already have an open request ({ticket_id}). Please wait',
    'You already have an open request. Please wait'),
  'Your request is submitted. Our admin will reply here soon.',
  'You already have an open request. Please wait for our reply.'
)::jsonb
where id = 1;
