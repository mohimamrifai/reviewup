-- ensure_handle_new_user_writes_leader_id.sql
--
-- Idempotent migrasi: pastikan trigger `handle_new_user` di auth.users
-- SELALU menulis `profiles.leader_id` untuk admin_staff yang dibuat
-- dengan `user_metadata.leader_id`.
--
-- Latar belakang: implementasi `createAdminUser` sudah benar mengirim
-- `user_metadata.leader_id` ke `auth.admin.createUser`, namun beberapa
-- deployment DB masih menjalankan versi lama fungsi trigger
-- (`fix_trigger_search_path.sql` saja) yang TIDAK menulis `leader_id`.
-- Akibatnya `profiles.leader_id` tetap NULL sehingga leader tidak bisa
-- memantau staff-nya di dashboard.
--
-- Migrasi ini `CREATE OR REPLACE FUNCTION` jadi aman di-re-apply.
-- Tidak ada perubahan data; hanya memperbarui definisi fungsi/trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username  TEXT := NULLIF(NEW.raw_user_meta_data->>'username', '');
  v_role      TEXT := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'member');
  v_referral  TEXT := NULLIF(NEW.raw_user_meta_data->>'referral_code', '');
  v_leader_id TEXT := NULLIF(NEW.raw_user_meta_data->>'leader_id', '');
BEGIN
  -- Validasi role (fallback ke 'member' jika nilai tak dikenal)
  IF v_role NOT IN ('super_admin', 'admin_leader', 'admin_staff', 'member') THEN
    v_role := 'member';
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    role,
    referral_code,
    leader_id
  )
  VALUES (
    NEW.id,
    v_username,
    v_role,
    v_referral,
    -- Hanya set leader_id untuk admin_staff DAN hanya jika target leader
    -- benar-benar ada di tabel profiles dengan role admin_leader.
    CASE
      WHEN v_role = 'admin_staff' AND v_leader_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = v_leader_id::uuid AND role = 'admin_leader')
      THEN v_leader_id::uuid
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    username       = COALESCE(EXCLUDED.username, profiles.username),
    role           = COALESCE(EXCLUDED.role, profiles.role),
    referral_code  = COALESCE(EXCLUDED.referral_code, profiles.referral_code),
    -- PENTING: jangan override leader_id yang sudah valid dengan NULL.
    -- Hanya timpa kalau EXCLUDED membawa nilai baru.
    leader_id      = COALESCE(EXCLUDED.leader_id, profiles.leader_id);

  RETURN NEW;
END;
$$;

-- Pastikan trigger-nya terpasang (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant eksekusi untuk role Supabase Auth (jika perlu)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
