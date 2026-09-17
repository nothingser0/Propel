'use client'

import { Calendar, AlertTriangle, CheckSquare, Clock } from 'lucide-react'
import type { Task, TaskPriority } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onSelect: (task: Task) => void
}

const PRIORITY_BADGES: Record<
  TaskPriority,
  { label: string; short: string; className: string }
> = {
  high: {
    label: 'High',
    short: 'H',
    className:
      'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  },
  medium: {
    label: 'Medium',
    short: 'M',
    className:
      'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
  },
  low: {
    label: 'Low',
    short: 'L',
    className:
      'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return null

  const now = new Date()
  const isOverdue = date.getTime() < now.getTime()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return {
    label: isToday ? 'Today' : formatted,
    isOverdue,
  }
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const priority = PRIORITY_BADGES[task.priority] ?? PRIORITY_BADGES.medium
  const deadlineInfo = formatDeadline(task.deadline)

  const subtaskTotal =
    task.subtask_count ?? (task.subtasks ? task.subtasks.length : 0)
  const subtaskDone =
    task.subtasks_done ??
    (task.subtasks ? task.subtasks.filter((s) => s.is_done).length : 0)
  const percentDone =
    subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(task)
        }
      }}
      className="group relative flex flex-col w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0079BF]"
    >
      {/* Header: Title & Priority */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-[#0079BF] transition-colors">
          {task.title}
        </h3>
        <span
          title={`Priority: ${priority.label}`}
          className={`shrink-0 flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${priority.className}`}
        >
          {priority.short}
        </span>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar if any subtasks */}
      {subtaskTotal > 0 && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/60">
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
              <CheckSquare className="h-3 w-3 text-emerald-500" />
              {subtaskDone}/{subtaskTotal} subtasks
            </span>
            <span>{percentDone}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${percentDone}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Metadata */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          {deadlineInfo ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${
                deadlineInfo.isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : ''
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {deadlineInfo.isOverdue ? `Overdue (${deadlineInfo.label})` : deadlineInfo.label}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">No deadline</span>
          )}
        </div>

        {/* Risk Warning Indicator */}
        {task.risk_level && (
          <span
            title={task.risk_level === 'high_risk' ? 'High risk deadline' : 'At risk deadline'}
            className="inline-flex items-center"
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                task.risk_level === 'high_risk' ? 'text-red-500' : 'text-amber-500'
              }`}
            />
          </span>
        )}
      </div>
    </div>
  )
}
