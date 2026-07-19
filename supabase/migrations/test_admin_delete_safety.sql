-- test_admin_delete_safety.sql
--
-- Test non-destruktif: verifikasi bahwa SETIAP foreign key yang menunjuk ke
-- public.profiles sudah benar (ON DELETE SET NULL atau ON DELETE CASCADE),
-- TIDAK ada yang masih ON DELETE NO ACTION / RESTRICT (yang akan blokir delete).
--
-- Test ini TIDAK mengubah/insert/delete data apapun — hanya query metadata.

DO $$
DECLARE
  -- Expected constraints: ON DELETE behavior per column
  -- Format: table.column -> expected_delete_rule
  --   'SET NULL'  → nullable column yang harus diset NULL saat target dihapus
  --   'CASCADE'   → child rows ikut terhapus saat target dihapus
  v_total    INTEGER := 0;
  v_passed   INTEGER := 0;
  v_failed   INTEGER := 0;
  v_missing  INTEGER := 0;
  v_msg      TEXT;
  v_pass     BOOLEAN;
  r          RECORD;
  v_first_id UUID;
  v_first_table TEXT;
  v_first_column TEXT;
  v_first_rule TEXT;
  v_first_test_step TEXT;
BEGIN
  RAISE NOTICE '=== FK CONSTRAINT VERIFICATION TEST ===';
  RAISE NOTICE 'Memverifikasi semua FK ke public.profiles.id...';
  RAISE NOTICE '';

  -- Iterate all FK constraints yang menunjuk ke public.profiles
  FOR r IN
    SELECT
      tc.table_name,
      kcu.column_name,
      rc.delete_rule,
      ccu.column_name AS referenced_column,
      ccu.table_name  AS referenced_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'id'
    ORDER BY tc.table_name, kcu.column_name
  LOOP
    v_total := v_total + 1;
    -- Validasi: delete_rule HARUS 'CASCADE' atau 'SET NULL'
    -- (TIDAK boleh 'NO ACTION' atau 'RESTRICT' yang akan blokir delete)
    IF r.delete_rule IN ('CASCADE', 'SET NULL') THEN
      v_passed := v_passed + 1;
      RAISE NOTICE '  PASS: %.% -> %.% (ON DELETE %)',
        r.table_name, r.column_name, r.referenced_table, r.referenced_column, r.delete_rule;
    ELSE
      v_failed := v_failed + 1;
      RAISE WARNING '  FAIL: %.% -> %.% (ON DELETE %) — BLOKIR DELETE!',
        r.table_name, r.column_name, r.referenced_table, r.referenced_column, r.delete_rule;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Verifikasi tambahan: ada staff dengan leader_id NULL? (data orphan) ===';
  -- Cek data orphan (staff tanpa leader) — info saja, tidak dianggap pass/fail
  SELECT COUNT(*) INTO v_missing
  FROM public.profiles
  WHERE role = 'admin_staff' AND leader_id IS NULL;
  RAISE NOTICE '  Staff orphan (leader_id IS NULL): % baris', v_missing;
  IF v_missing > 0 THEN
    RAISE NOTICE '  -> Catatan: data orphan ada. Bisa di-link via UI "Set Leader" di /admin/team';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== RINGKASAN ===';
  RAISE NOTICE 'Total FK constraints ke profiles: %', v_total;
  RAISE NOTICE '  PASS (CASCADE/SET NULL): %', v_passed;
  RAISE NOTICE '  FAIL (NO ACTION/RESTRICT): %', v_failed;
  RAISE NOTICE '';

  -- ============ STEP 2: Verifikasi trigger handle_new_user exist dan proper ============
  RAISE NOTICE '=== Verifikasi trigger handle_new_user ===';
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE '  PASS: Trigger on_auth_user_created ada di auth.users';
    v_passed := v_passed + 1;
  ELSE
    RAISE WARNING '  FAIL: Trigger on_auth_user_created TIDAK ada';
    v_failed := v_failed + 1;
  END IF;
  v_total := v_total + 1;

  -- ============ STEP 3: Verifikasi function handle_new_user punya logic leader_id ============
  RAISE NOTICE '=== Verifikasi function handle_new_user ===';
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      AND pg_get_functiondef(p.oid) LIKE '%leader_id%'
  ) THEN
    RAISE NOTICE '  PASS: Function public.handle_new_user() punya referensi leader_id';
    v_passed := v_passed + 1;
  ELSE
    RAISE WARNING '  FAIL: Function handle_new_user() TIDAK punya referensi leader_id';
    v_failed := v_failed + 1;
  END IF;
  v_total := v_total + 1;

  -- ============ FINAL ============
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL RESULT ===';
  RAISE NOTICE 'Total checks: %, Passed: %, Failed: %', v_total, v_passed, v_failed;

  IF v_failed = 0 THEN
    RAISE NOTICE '=== ALL CHECKS PASSED — system aman untuk hapus admin ===';
  ELSE
    RAISE EXCEPTION '=== % CHECKS FAILED — jalankan ensure_all_fk_to_profiles_safe_to_delete.sql ===',
      v_failed;
  END IF;
END $$;
