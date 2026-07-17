-- ============================================================
-- Tambah 'dikerjakan' ke enum task_status
-- ============================================================
-- Schema Drizzle punya 5 nilai (menunggu, dipilih, dikerjakan, selesai, dibatalkan)
-- tapi enum di database hanya punya 4 (tanpa 'dikerjakan').
-- Supaya flow 'dipilih' → 'dikerjakan' → 'selesai' valid.

ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'dikerjakan' AFTER 'dipilih';
