-- Migrasi akun lama dari @reviewup.local ke @reviewup.app
-- Karena GoTrue (Supabase Auth) menolak TLD .local saat signIn/signUp.

UPDATE auth.users
SET email = REPLACE(email, '@reviewup.local', '@reviewup.app')
WHERE email LIKE '%@reviewup.local';

UPDATE auth.identities
SET provider_id = REPLACE(provider_id, '@reviewup.local', '@reviewup.app')
WHERE provider_id LIKE '%@reviewup.local';
