'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function TaskDetailPanel({
  task,
  onClose,
  onUpdated,
  onArchived,
}: {
  task: Task
  onClose: () => void
  onUpdated: (task: Task) => void
  onArchived: (id: string) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [deadline, setDeadline] = useState(toLocalInput(task.deadline))
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function save() {
    if (!title.trim() || title.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Title invalid',
        description: 'Title must be at least 3 characters.',
      })
      return
    }

    setIsSaving(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    })
    const json = await res.json()
    setIsSaving(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Update failed', description: json.message })
      return
    }
    toast({ title: 'Task updated', description: 'Changes saved successfully.' })
    onUpdated(json.data)
  }

  async function archive() {
    setIsDeleting(true)
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    const json = await res.json()
    setIsDeleting(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Archive failed', description: json.message })
      return
    }
    toast({ title: 'Task archived', description: 'Task removed from board.' })
    onArchived(task.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <aside className="w-full max-w-md h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Task Detail
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Fields */}
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Title
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <textarea
                id="edit-description"
                rows={4}
                className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0079BF]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Status
                </Label>
                <select
                  id="edit-status"
                  className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0079BF]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-priority" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Priority
                </Label>
                <select
                  id="edit-priority"
                  className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0079BF]"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Deadline
              </Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            {/* Created & Updated Info */}
            <div className="pt-2 text-[11px] text-gray-400 space-y-1 border-t border-gray-100 dark:border-gray-800">
              <p>Created: {new Date(task.created_at).toLocaleString()}</p>
              <p>Last updated: {new Date(task.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Button
            className="w-full bg-[#0079BF] hover:bg-[#026AA7] text-white"
            onClick={save}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={archive}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Archiving...' : 'Archive Task'}
          </Button>
        </div>
      </aside>
    </div>
  )
}
