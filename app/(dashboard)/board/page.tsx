import { KanbanBoard } from '@/components/kanban/kanban-board'
import { createClient } from '@/lib/supabase/server'
import type { Task } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_archived', false)
    .order('position', { ascending: true })

  return <KanbanBoard initialTasks={(data ?? []) as Task[]} />
}
