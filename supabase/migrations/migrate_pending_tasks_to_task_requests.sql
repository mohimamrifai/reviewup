INSERT INTO public.task_requests (
  member_id,
  request_count,
  requested_at,
  created_at,
  updated_at
)
SELECT
  member_id,
  COUNT(*)::int AS request_count,
  MAX(updated_at) AS requested_at,
  MIN(created_at) AS created_at,
  MAX(updated_at) AS updated_at
FROM public.tasks
WHERE product_id IS NULL
  AND status = 'menunggu'::task_status
GROUP BY member_id
ON CONFLICT (member_id) DO UPDATE
SET
  request_count = public.task_requests.request_count + EXCLUDED.request_count,
  requested_at = GREATEST(public.task_requests.requested_at, EXCLUDED.requested_at),
  updated_at = GREATEST(public.task_requests.updated_at, EXCLUDED.updated_at);

DELETE FROM public.tasks
WHERE product_id IS NULL
  AND status = 'menunggu'::task_status;

UPDATE public.tasks
SET status = 'dipilih'::task_status,
    updated_at = now()
WHERE product_id IS NOT NULL
  AND status = 'menunggu'::task_status;
