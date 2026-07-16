-- Aktifkan pgcrypto extension (diperlukan oleh trigger handle_new_user
-- yang pakai crypt() + gen_salt() untuk hash withdraw password).
-- Sebelumnya extension ini diasumsikan sudah ada tapi ternyata tidak terinstall
-- di Supabase project, menyebabkan register gagal dengan HTTP 500 / "Database
-- error creating new user".

CREATE EXTENSION IF NOT EXISTS pgcrypto;
