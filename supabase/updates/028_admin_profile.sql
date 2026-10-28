alter table public.admins add column if not exists display_name text;
alter table public.admins add column if not exists avatar_path text;

drop policy if exists "admins update own row" on public.admins;
create policy "admins update own row" on public.admins
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin uploads own avatar" on storage.objects;
create policy "admin uploads own avatar" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "admin deletes own avatar" on storage.objects;
create policy "admin deletes own avatar" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
