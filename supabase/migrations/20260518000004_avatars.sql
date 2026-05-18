-- Avatar support for user profiles
alter table public.profiles add column if not exists avatar_url text;

-- Storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, '{image/png,image/jpeg,image/webp,image/gif}')
on conflict (id) do nothing;

-- RLS: authenticated users can upload to their own folder
create policy "Users can upload own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: anyone can read avatars (public bucket)
create policy "Anyone can read avatars"
  on storage.objects
  for select
  using (bucket_id = 'avatars');
