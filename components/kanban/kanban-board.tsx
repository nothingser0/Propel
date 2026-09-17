'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTaskModal } from '@/components/kanban/create-task-modal'
import { TaskCard } from '@/components/kanban/task-card'
import { TaskDetailPanel } from '@/components/kanban/task-detail-panel'
import type { Task, TaskStatus } from '@/lib/types'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)

  const grouped = useMemo(() => {
    return COLUMNS.reduce<Record<TaskStatus, Task[]>>(
      (acc, col) => {
        acc[col.status] = tasks
          .filter((task) => task.status === col.status)
          .sort((a, b) => a.position - b.position)
        return acc
      },
      { todo: [], in_progress: [], done: [] }
    )
  }, [tasks])

  const empty = tasks.length === 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      {empty && (
        <p className="mb-4 text-sm text-gray-500">
          No tasks yet. Click + to create one.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-4 font-semibold text-gray-700">{col.title}</h2>
            <div className="space-y-2">
              {grouped[col.status].length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada task</p>
              ) : (
                grouped[col.status].map((task) => (
                  <TaskCard key={task.id} task={task} onSelect={setSelected} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(task) => setTasks((prev) => [...prev, task])}
      />

      {selected && (
        <TaskDetailPanel
          key={selected.id}
          task={selected}
          onClose={() => setSelected(null)}
          onUpdated={(task) => {
            setTasks((prev) => prev.map((item) => (item.id === task.id ? task : item)))
            setSelected(task)
          }}
          onArchived={(id) => setTasks((prev) => prev.filter((item) => item.id !== id))}
        />
      )}
    </div>
  )
}
