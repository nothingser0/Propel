'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Plus, Trash2, Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import type { Subtask } from '@/lib/types'

interface AIBreakdownModalProps {
  open: boolean
  taskId: string
  taskTitle: string
  taskDescription?: string | null
  onClose: () => void
  onSubtasksAdded: (newSubtasks: Subtask[]) => void
}

interface DraftSubtask {
  id: string
  title: string
  estimatedMinutes: number
}

export function AIBreakdownModal({
  open,
  taskId,
  taskTitle,
  taskDescription,
  onClose,
  onSubtasksAdded,
}: AIBreakdownModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subtasks, setSubtasks] = useState<DraftSubtask[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, loading, onClose])

  if (!open) return null

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'AI breakdown failed')
      }

      const drafts = (json.data || []).map((item: any, idx: number) => ({
        id: `draft-${Date.now()}-${idx}`,
        title: item.title,
        estimatedMinutes: item.estimatedMinutes || 30,
      }))

      setSubtasks(drafts)
      setHasGenerated(true)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'AI Breakdown Error',
        description: err.message || 'AI service unavailable, please add manually.',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAddDraft() {
    setSubtasks((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${prev.length}`,
        title: 'New subtask',
        estimatedMinutes: 30,
      },
    ])
  }

  function handleUpdateTitle(id: string, newTitle: string) {
    setSubtasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    )
  }

  function handleRemoveDraft(id: string) {
    setSubtasks((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleAcceptAll() {
    if (subtasks.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No subtasks',
        description: 'Generate or add at least one subtask.',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtasks: subtasks.map((s) => ({
            title: s.title,
            estimated_minutes: s.estimatedMinutes,
          })),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save subtasks')
      }

      toast({
        title: 'Subtasks added',
        description: `Added ${subtasks.length} subtasks to task.`,
      })

      onSubtasksAdded(json.data)
      onClose()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-[#0079BF]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                AI Task Breakdown
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
                {taskTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {!hasGenerated && !loading ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Let Propel AI break down this task into 5–7 actionable subtasks with time estimates.
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-[#0079BF] hover:bg-[#026AA7] text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Subtasks
              </Button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0079BF]" />
              <p className="text-xs font-medium text-gray-500">
                Analyzing requirements & synthesizing subtasks...
              </p>
            </div>
          ) : null}

          {hasGenerated && !loading ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggested Subtasks ({subtasks.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddDraft}
                  className="inline-flex items-center text-xs font-medium text-[#0079BF] hover:underline"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add item
                </button>
              </div>

              {subtasks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40"
                >
                  <Input
                    value={item.title}
                    onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                    className="h-8 text-xs flex-1 bg-white dark:bg-gray-900"
                  />
                  <span className="inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded text-[11px] font-medium bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    <Clock className="h-3 w-3" />
                    {item.estimatedMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDraft(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {hasGenerated && !loading ? (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <Button variant="ghost" size="sm" onClick={handleGenerate}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-[#0079BF] hover:bg-[#026AA7] text-white"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Add All to Task
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
