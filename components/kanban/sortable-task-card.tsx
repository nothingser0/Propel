'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from '@/components/kanban/task-card'
import type { Task } from '@/lib/types'

interface SortableTaskCardProps {
  task: Task
  onSelect: (task: Task) => void
}

export function SortableTaskCard({ task, onSelect }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 rounded-lg border-2 border-dashed border-[#0079BF] min-h-[90px] bg-blue-50/50 dark:bg-blue-950/20"
      />
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onSelect={onSelect} />
    </div>
  )
}
