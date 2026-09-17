'use client'

import { useEffect, useState } from 'react'
import {
  X,
  Trash2,
  Sparkles,
  Plus,
  Play,
  Square,
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AIBreakdownModal } from '@/components/kanban/ai-breakdown-modal'
import { useTimerStore } from '@/lib/stores/timer-store'
import { useToast } from '@/hooks/use-toast'
import type { Subtask, Task, TaskPriority, TaskStatus } from '@/lib/types'

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
  onRestored,
}: {
  task: Task
  onClose: () => void
  onUpdated: (task: Task) => void
  onArchived: (id: string) => void
  onRestored?: (task: Task) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [deadline, setDeadline] = useState(toLocalInput(task.deadline))
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks ?? [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  // Timer store
  const { activeEntry, isRunning, startTimer, stopTimer } = useTimerStore()
  const isTimerRunningOnThisTask = isRunning && activeEntry?.task_id === task.id

  // Fetch fresh subtasks on mount if not provided & handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    async function loadSubtasks() {
      try {
        const res = await fetch(`/api/tasks/${task.id}/subtasks`)
        if (res.ok) {
          const json = await res.json()
          setSubtasks(json.data ?? [])
        }
      } catch {
        // Fallback to task.subtasks
      }
    }
    loadSubtasks()

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [task.id, onClose])

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
    onUpdated({ ...json.data, subtasks })
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
    onArchived(task.id)
    onClose()

    toast({
      title: 'Task archived',
      description: `"${task.title}" has been archived.`,
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            const restoreRes = await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_archived: false }),
            })
            const restoreJson = await restoreRes.json()
            if (restoreRes.ok && restoreJson.data) {
              if (onRestored) onRestored(restoreJson.data)
              toast({
                title: 'Task restored',
                description: `"${task.title}" was restored back to your board.`,
              })
            }
          } catch {
            toast({ variant: 'destructive', title: 'Could not restore task' })
          }
        },
      },
    })
  }

  // Toggle subtask status
  async function handleToggleSubtask(subtaskId: string, currentDone: boolean) {
    const nextDone = !currentDone
    // Optimistic
    const nextList = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, is_done: nextDone } : s
    )
    setSubtasks(nextList)
    onUpdated({ ...task, subtasks: nextList })

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: nextDone }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Rollback
      setSubtasks(subtasks)
      toast({ variant: 'destructive', title: 'Failed to update subtask' })
    }
  }

  // Add subtask
  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || newSubtaskTitle.length < 2) return

    setAddingSubtask(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      const updated = [...subtasks, json.data]
      setSubtasks(updated)
      setNewSubtaskTitle('')
      onUpdated({ ...task, subtasks: updated })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to add subtask', description: err.message })
    } finally {
      setAddingSubtask(false)
    }
  }

  // Delete subtask
  async function handleDeleteSubtask(subtaskId: string) {
    const prev = [...subtasks]
    const nextList = subtasks.filter((s) => s.id !== subtaskId)
    setSubtasks(nextList)
    onUpdated({ ...task, subtasks: nextList })

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setSubtasks(prev)
      toast({ variant: 'destructive', title: 'Failed to delete subtask' })
    }
  }

  // Timer toggle
  async function handleTimerClick() {
    try {
      if (isTimerRunningOnThisTask) {
        await stopTimer()
        toast({ title: 'Timer stopped', description: 'Session recorded.' })
      } else {
        await startTimer(task.id, task.title)
        toast({ title: 'Timer started', description: `Tracking time for ${task.title}` })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Timer error' })
    }
  }

  const subtasksTotal = subtasks.length
  const subtasksDoneCount = subtasks.filter((s) => s.is_done).length
  const progressPercent =
    subtasksTotal > 0 ? Math.round((subtasksDoneCount / subtasksTotal) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <aside className="w-full max-w-lg h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Task Detail
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Timer Button */}
              <button
                type="button"
                onClick={handleTimerClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-2xs ${
                  isTimerRunningOnThisTask
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900'
                    : 'bg-blue-50 text-[#0079BF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900 hover:bg-blue-100'
                }`}
              >
                {isTimerRunningOnThisTask ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Stop Timer
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Track Time
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                rows={3}
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

            {/* Subtasks Section */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Subtasks ({subtasksDoneCount}/{subtasksTotal})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAiModalOpen(true)}
                  className="h-7 text-xs border-blue-200 dark:border-blue-900 text-[#0079BF] hover:bg-blue-50 dark:hover:bg-blue-950/50"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-500" />
                  AI Breakdown
                </Button>
              </div>

              {/* Progress Bar */}
              {subtasksTotal > 0 && (
                <div className="mb-3">
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtask items checklist */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(subtask.id, subtask.is_done)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      {subtask.is_done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          subtask.is_done
                            ? 'line-through text-gray-400'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      {subtask.estimated_minutes ? (
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {subtask.estimated_minutes}m
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-opacity"
                        title="Delete subtask"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="h-8 text-xs"
                  disabled={addingSubtask}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs shrink-0"
                  disabled={addingSubtask || !newSubtaskTitle.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </form>
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

        {/* AI Breakdown Modal */}
        <AIBreakdownModal
          open={aiModalOpen}
          taskId={task.id}
          taskTitle={task.title}
          taskDescription={task.description}
          onClose={() => setAiModalOpen(false)}
          onSubtasksAdded={(added) => {
            const combined = [...subtasks, ...added]
            setSubtasks(combined)
            onUpdated({ ...task, subtasks: combined })
          }}
        />
      </aside>
    </div>
  )
}
