-- ============================================================
-- Cleanup: bersihkan semua data development KECUALI products
-- ============================================================
-- Versi dari `cleanup_dev_data.sql` yang mempertahankan data
-- produk (katalog) agar tidak perlu input ulang.
-- Menghapus child tables + profiles + auth users.
-- commission_settings TIDAK di-truncate (default values tetap).

BEGIN;

TRUNCATE TABLE
  public.audit_logs,
  public.bank_accounts,
  public.deposits,
  public.withdrawals,
  public.tasks,
  public.task_requests,
  public.deposit_bank_accounts,
  public.customer_service_channels
RESTART IDENTITY CASCADE;

DELETE FROM public.profiles;
DELETE FROM auth.identities;
DELETE FROM auth.users;

COMMIT;
