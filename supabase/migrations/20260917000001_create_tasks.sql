CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  deadline timestamptz,
  position integer NOT NULL DEFAULT 0,
  risk_level text CHECK (risk_level IS NULL OR risk_level IN ('high_risk', 'at_risk')),
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX idx_tasks_status ON public.tasks (status);
CREATE INDEX idx_tasks_deadline ON public.tasks (deadline) WHERE is_archived = false;
CREATE INDEX idx_tasks_position ON public.tasks (user_id, status, position);
