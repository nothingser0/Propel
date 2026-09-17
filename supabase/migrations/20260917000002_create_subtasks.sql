CREATE TABLE public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  is_done boolean NOT NULL DEFAULT false,
  estimated_minutes integer CHECK (estimated_minutes IS NULL OR (estimated_minutes >= 0 AND estimated_minutes <= 999)),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subtasks_task_id ON public.subtasks (task_id);
