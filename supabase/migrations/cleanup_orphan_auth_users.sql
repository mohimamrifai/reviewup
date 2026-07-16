-- Cleanup: hapus user di auth.users yang tidak punya profile
-- (akibat register gagal karena trigger error sebelumnya).
-- Aman: CASCADE ke profiles.identities juga akan terhapus.

DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND raw_user_meta_data->>'username' IS NOT NULL
  AND email LIKE '%@reviewup.app';
