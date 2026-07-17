CREATE TABLE IF NOT EXISTS public.task_requests (
  id serial PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_count integer NOT NULL DEFAULT 1,
  requested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS task_requests_member_id_unique
  ON public.task_requests(member_id);

CREATE INDEX IF NOT EXISTS task_requests_requested_at_idx
  ON public.task_requests(requested_at);
