'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Task } from '@/lib/types'

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
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
  const [priority, setPriority] = useState(task.priority)
  const [deadline, setDeadline] = useState(toLocalInput(task.deadline))
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    })
    const json = await res.json()
    setIsSaving(false)

    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Update gagal', description: json.message })
      return
    }
    onUpdated(json.data)
  }

  async function archive() {
    const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Hapus gagal', description: json.message })
      return
    }
    onArchived(task.id)
    onClose()
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-white p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold">Task</h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <textarea
            id="edit-description"
            className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-priority">Priority</Label>
          <select
            id="edit-priority"
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-deadline">Deadline</Label>
          <Input
            id="edit-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="destructive" className="w-full" onClick={archive}>
          Archive
        </Button>
      </div>
    </aside>
  )
}
