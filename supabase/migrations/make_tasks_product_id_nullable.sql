-- ============================================================
-- Make tasks.product_id nullable (request flow: admin selects product later)
-- ============================================================

ALTER TABLE public.tasks
  ALTER COLUMN product_id DROP NOT NULL;
