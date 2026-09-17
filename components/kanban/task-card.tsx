'use client'

import type { Task, TaskPriority } from '@/lib/types'

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
}

export function TaskCard({
  task,
  onSelect,
}: {
  task: Task
  onSelect: (task: Task) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="w-full rounded-md border border-gray-200 bg-white p-3 text-left shadow-sm hover:border-gray-300"
    >
      <p className="font-medium">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 ${PRIORITY_CLASS[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.deadline && (
          <span className="text-gray-500">
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  )
}
