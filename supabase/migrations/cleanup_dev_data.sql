-- ============================================================
-- Cleanup: bersihkan semua data development
-- ============================================================
-- Menghapus semua child tables + profiles + auth users.
-- commission_settings TIDAK di-truncate (default values tetap).

BEGIN;

TRUNCATE TABLE
  public.audit_logs,
  public.bank_accounts,
  public.deposits,
  public.withdrawals,
  public.tasks,
  public.products,
  public.deposit_bank_accounts,
  public.customer_service_channels
RESTART IDENTITY CASCADE;

DELETE FROM public.profiles;
DELETE FROM auth.identities;
DELETE FROM auth.users;

COMMIT;
