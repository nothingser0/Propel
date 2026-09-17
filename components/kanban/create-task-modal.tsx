'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskFormSchema, type CreateTaskFormValues } from '@/lib/validators/task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Task } from '@/lib/types'

export function CreateTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (task: Task) => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: { title: '', description: '', priority: 'medium', deadline: '' },
  })

  if (!open) return null

  async function onSubmit(values: CreateTaskFormValues) {
    setIsLoading(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        deadline: values.deadline || null,
      }),
    })
    const json = await res.json()
    setIsLoading(false)

    if (!res.ok) {
      toast({
        variant: 'destructive',
        title: 'Gagal membuat task',
        description: json.message,
      })
      return
    }

    onCreated(json.data)
    reset({ title: '', description: '', priority: 'medium', deadline: '' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">New task</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              {...register('description')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
              {...register('priority')}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="datetime-local" {...register('deadline')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
