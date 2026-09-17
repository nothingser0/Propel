CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT time_entries_end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_time_entries_user_id ON public.time_entries (user_id);
CREATE INDEX idx_time_entries_task_id ON public.time_entries (task_id);
CREATE INDEX idx_time_entries_start_time ON public.time_entries (user_id, start_time DESC);
