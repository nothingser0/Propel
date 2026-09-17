'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { createTaskFormSchema, type CreateTaskFormValues } from '@/lib/validators/task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

interface CreateTaskModalProps {
  open: boolean
  initialStatus?: TaskStatus
  onClose: () => void
  onCreated: (task: Task) => void
}

export function CreateTaskModal({
  open,
  initialStatus = 'todo',
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: initialStatus,
      deadline: '',
    },
  })

  const watchedTitle = watch('title')
  const watchedDescription = watch('description')
  const watchedDeadline = watch('deadline')

  // Reset form with current initialStatus when modal opens
  useEffect(() => {
    if (open) {
      setAiSuggested(null)
      reset({
        title: '',
        description: '',
        priority: 'medium',
        status: initialStatus,
        deadline: '',
      })
    }
  }, [open, initialStatus, reset])

  async function handleSuggestPriority() {
    if (!watchedTitle || watchedTitle.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Enter a task title first so AI can determine priority.',
      })
      return
    }

    setIsSuggestingPriority(true)
    try {
      const res = await fetch('/api/ai/suggest-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: watchedTitle,
          description: watchedDescription || null,
          deadline: watchedDeadline || null,
        }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setValue('priority', json.data.priority as TaskPriority)
        setAiSuggested(json.data.reason)
        toast({
          title: 'Priority suggested',
          description: `${json.data.priority.toUpperCase()} - ${json.data.reason}`,
        })
      }
    } catch {
      // Ignore background suggestion errors
    } finally {
      setIsSuggestingPriority(false)
    }
  }

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
        status: values.status || initialStatus,
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
    toast({
      title: 'Task dibuat',
      description: `Task "${json.data.title}" berhasil ditambahkan.`,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New Task
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Add a task to your workflow board
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Design authentication workflow"
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add details, acceptance criteria, or context..."
              className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0079BF] focus:border-transparent transition-all"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Column Status
              </Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0079BF]"
                {...register('status')}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Priority
                </Label>
                <div className="flex items-center gap-1.5">
                  {aiSuggested ? (
                    <span
                      className="text-[10px] text-[#0079BF] font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 flex items-center gap-1 cursor-help"
                      title={aiSuggested}
                    >
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                      (AI suggested)
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSuggestPriority}
                    disabled={isSuggestingPriority}
                    className="text-[11px] text-[#0079BF] hover:underline flex items-center gap-0.5"
                    title="Suggest priority with AI based on deadline & keywords"
                  >
                    {isSuggestingPriority ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        Suggest
                      </>
                    )}
                  </button>
                </div>
              </div>
              <select
                id="priority"
                className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0079BF]"
                {...register('priority', {
                  onChange: () => setAiSuggested(null), // Clear AI tag if user manually overrides
                })}
              >
                <option value="high">High (urgent)</option>
                <option value="medium">Medium (standard)</option>
                <option value="low">Low (minor)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Target Deadline
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline', {
                onChange: () => {
                  // If title exists, trigger suggestion
                  if (watchedTitle && watchedTitle.trim().length >= 2) {
                    setTimeout(() => handleSuggestPriority(), 100)
                  }
                },
              })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#0079BF] hover:bg-[#026AA7] text-white"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
