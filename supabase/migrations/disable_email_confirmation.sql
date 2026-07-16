-- Disable email confirmation agar signUp langsung auto-login
-- (untuk development; di production bisa di-enable lagi + pakai SMTP)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config SET enable_confirmations = false;
  END IF;
END $$;
