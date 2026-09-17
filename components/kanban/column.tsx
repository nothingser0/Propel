'use client'

import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'
import { TaskCard } from '@/components/kanban/task-card'
import type { Task, TaskStatus } from '@/lib/types'

interface ColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  onSelectTask: (task: Task) => void
  onQuickAdd: (status: TaskStatus) => void
}

const COLUMN_CONFIG: Record<
  TaskStatus,
  {
    icon: typeof Circle
    accentColor: string
    badgeBg: string
    badgeText: string
    emptyText: string
  }
> = {
  todo: {
    icon: Circle,
    accentColor: 'text-gray-400 dark:text-gray-500',
    badgeBg: 'bg-gray-200/70 dark:bg-gray-800',
    badgeText: 'text-gray-700 dark:text-gray-300',
    emptyText: 'No tasks to do',
  },
  in_progress: {
    icon: Clock,
    accentColor: 'text-[#0079BF]',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-[#0079BF] dark:text-blue-300',
    emptyText: 'Nothing in progress',
  },
  done: {
    icon: CheckCircle2,
    accentColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    emptyText: 'No completed tasks yet',
  },
}

export function Column({
  status,
  title,
  tasks,
  onSelectTask,
  onQuickAdd,
}: ColumnProps) {
  const config = COLUMN_CONFIG[status]
  const Icon = config.icon

  return (
    <div className="flex flex-col rounded-xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800/80 p-3 sm:p-4 min-h-[450px]">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-gray-800/60 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.accentColor}`} />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}
          >
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onQuickAdd(status)}
          className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
          title={`Add task to ${title}`}
          aria-label={`Add task to ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-gray-300 dark:border-gray-800 p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {config.emptyText}
            </p>
            <button
              type="button"
              onClick={() => onQuickAdd(status)}
              className="mt-2 text-xs font-medium text-[#0079BF] hover:underline"
            >
              + Add a task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
          ))
        )}
      </div>
    </div>
  )
}
