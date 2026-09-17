ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own subtasks" ON public.subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own subtasks" ON public.subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own subtasks" ON public.subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own subtasks" ON public.subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own time_entries" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own time_entries" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own time_entries" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own time_entries" ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own task_tags" ON public.task_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own task_tags" ON public.task_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = task_tags.tag_id AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own task_tags" ON public.task_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
    )
  );
