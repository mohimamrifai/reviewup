-- Verifikasi status email confirmation
DO $$
DECLARE
  v_enabled boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    SELECT enable_confirmations INTO v_enabled FROM auth.config LIMIT 1;
    RAISE NOTICE 'Email confirmation enabled: %', v_enabled;
  ELSE
    RAISE NOTICE 'auth.config table not found, cannot verify';
  END IF;
END $$;
