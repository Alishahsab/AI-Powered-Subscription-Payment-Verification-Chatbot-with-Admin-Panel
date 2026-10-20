-- Replace "agent" with "admin" in the saved support messages.
update public.store_config
set settings = replace(
  replace(
    replace(settings::text,
      'Your request is submitted. An agent will join and reply here soon.',
      'Your request is submitted. Our admin will reply here soon.'),
    'An agent will join you shortly and reply right here.',
    'Our admin will reply right here shortly.'),
  'An agent will join and reply here soon.',
  'Our admin will reply here soon.'
)::jsonb
where id = 1;
