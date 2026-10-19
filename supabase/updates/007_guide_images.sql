insert into storage.buckets (id, name, public)
values ('guides', 'guides', true)
on conflict (id) do nothing;

drop policy if exists "admin uploads guide images" on storage.objects;
create policy "admin uploads guide images" on storage.objects
for insert to authenticated
with check (bucket_id = 'guides' and public.is_admin());

drop policy if exists "admin deletes guide images" on storage.objects;
create policy "admin deletes guide images" on storage.objects
for delete to authenticated
using (bucket_id = 'guides' and public.is_admin());
