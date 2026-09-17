'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, Kanban as KanbanIcon, Sparkles, AlertTriangle, Keyboard, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Column } from '@/components/kanban/column'
import { TaskCard } from '@/components/kanban/task-card'
import { CreateTaskModal } from '@/components/kanban/create-task-modal'
import { TaskDetailPanel } from '@/components/kanban/task-detail-panel'
import { KeyboardShortcutsModal } from '@/components/kanban/keyboard-shortcuts-modal'
import { useToast } from '@/hooks/use-toast'
import type { Task, TaskStatus, Tag } from '@/lib/types'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('todo')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [mobileTab, setMobileTab] = useState<'all' | TaskStatus>('all')
  const [filterRiskOnly, setFilterRiskOnly] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)

  // Fetch available tags on mount
  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          setAvailableTags(json.data)
        }
      })
      .catch(() => {})
  }, [])

  // Global keyboard shortcuts (C for create task, ? for shortcut cheatsheet)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleOpenCreate('todo')
      } else if (e.key === '?') {
        e.preventDefault()
        setShortcutsModalOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Setup sensors with activation constraints
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6, // 6px movement required to trigger drag, letting simple clicks through
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms hold required on touch to avoid interfering with scrolling
      tolerance: 6,
    },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  const atRiskCount = useMemo(() => {
    return tasks.filter((t) => t.risk_level === 'high_risk' || t.risk_level === 'at_risk').length
  }, [tasks])

  const grouped = useMemo(() => {
    let displayed = tasks

    if (filterRiskOnly) {
      displayed = displayed.filter(
        (t) => t.risk_level === 'high_risk' || t.risk_level === 'at_risk'
      )
    }

    if (selectedTagId) {
      displayed = displayed.filter((t) =>
        t.tags?.some((tag) => tag.id === selectedTagId)
      )
    }

    return COLUMNS.reduce<Record<TaskStatus, Task[]>>(
      (acc, col) => {
        acc[col.status] = displayed
          .filter((task) => task.status === col.status)
          .sort((a, b) => a.position - b.position)
        return acc
      },
      { todo: [], in_progress: [], done: [] }
    )
  }, [tasks, filterRiskOnly, selectedTagId])

  const isEmpty = tasks.length === 0

  function handleOpenCreate(status: TaskStatus = 'todo') {
    setCreateInitialStatus(status)
    setCreateOpen(true)
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const found = tasks.find((t) => t.id === active.id)
    if (found) {
      setActiveTask(found)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    const activeItem = tasks.find((t) => t.id === activeId)
    if (!activeItem) return

    // Check if dropping directly over a column container
    const isOverAColumn = COLUMNS.some((c) => c.status === overId)
    if (isOverAColumn) {
      const newStatus = overId as TaskStatus
      if (activeItem.status !== newStatus) {
        setTasks((prev) => {
          return prev.map((t) =>
            t.id === activeId ? { ...t, status: newStatus } : t
          )
        })
      }
      return
    }

    // Dropping over another card in another column
    const overItem = tasks.find((t) => t.id === overId)
    if (overItem && activeItem.status !== overItem.status) {
      setTasks((prev) => {
        return prev.map((t) =>
          t.id === activeId ? { ...t, status: overItem.status } : t
        )
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeItem = tasks.find((t) => t.id === activeId)
    if (!activeItem) return

    const previousSnapshot = [...tasks]

    // Determine target column and new position
    const isOverAColumn = COLUMNS.some((c) => c.status === overId)
    let targetStatus: TaskStatus = activeItem.status
    let newPosition = 0

    let nextTasks = [...tasks]

    if (isOverAColumn) {
      targetStatus = overId as TaskStatus
      const columnTasks = nextTasks.filter(
        (t) => t.status === targetStatus && t.id !== activeId
      )
      newPosition = columnTasks.length

      nextTasks = nextTasks.map((t) =>
        t.id === activeId
          ? { ...t, status: targetStatus, position: newPosition }
          : t
      )
    } else {
      const overItem = tasks.find((t) => t.id === overId)
      if (overItem) {
        targetStatus = overItem.status
        const columnTasks = nextTasks
          .filter((t) => t.status === targetStatus)
          .sort((a, b) => a.position - b.position)

        const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
        const newIndex = columnTasks.findIndex((t) => t.id === overId)

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(columnTasks, oldIndex, newIndex)
          newPosition = newIndex

          // Assign sequential positions within the column
          const updatedIdPositions = new Map(
            reordered.map((item, idx) => [item.id, idx])
          )

          nextTasks = nextTasks.map((t) => {
            if (t.status === targetStatus && updatedIdPositions.has(t.id)) {
              return { ...t, position: updatedIdPositions.get(t.id)! }
            }
            return t
          })
        } else {
          newPosition = overItem.position
          nextTasks = nextTasks.map((t) =>
            t.id === activeId
              ? { ...t, status: targetStatus, position: newPosition }
              : t
          )
        }
      }
    }

    // Apply optimistic update immediately
    setTasks(nextTasks)

    // Persist to backend
    try {
      const res = await fetch(`/api/tasks/${activeId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          position: newPosition,
        }),
      })

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson.message || 'Failed to move task')
      }
    } catch (err: any) {
      // Rollback on failure
      setTasks(previousSnapshot)
      toast({
        variant: 'destructive',
        title: 'Move failed',
        description: err?.message || 'Could not persist position. Rolled back.',
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Board Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <KanbanIcon className="h-6 w-6 text-[#0079BF]" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Kanban Board
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {tasks.length} total tasks &bull; {grouped.todo.length} to do, {grouped.in_progress.length} in progress, {grouped.done.length} completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Keyboard shortcuts (?)"
              aria-label="Open keyboard shortcuts"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <kbd className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-1 py-0.2 rounded border border-gray-200 dark:border-gray-700">
                ?
              </kbd>
            </button>
            <Button
              onClick={() => handleOpenCreate('todo')}
              className="bg-[#0079BF] hover:bg-[#026AA7] text-white shadow-sm font-medium text-sm transition-all"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New task
            </Button>
          </div>
        </div>

        {/* At-risk deadline alert banner */}
        {atRiskCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-semibold">{atRiskCount} task{atRiskCount > 1 ? 's' : ''} at risk</span> of missing deadline.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterRiskOnly((prev) => !prev)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-200/70 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 transition-colors"
            >
              {filterRiskOnly ? 'Show All Tasks' : 'Filter At-Risk'}
            </button>
          </div>
        )}

        {/* Tag Filter Bar */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 text-xs font-medium mr-1 flex items-center gap-1 shrink-0">
              <TagIcon className="h-3.5 w-3.5" /> Tags:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTagId(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedTagId === null
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Tags
            </button>
            {availableTags.map((tag) => {
              const isSelected = selectedTagId === tag.id
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border shrink-0 ${
                    isSelected
                      ? 'border-current shadow-xs font-bold ring-1 ring-current'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${tag.color}30` : `${tag.color}15`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Empty State Banner when Board has 0 tasks */}
        {isEmpty && (
          <div className="rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-8 text-center animate-in fade-in duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0079BF]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">
              No tasks yet. Click + to create one.
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Your workspace is fresh and clean. Get started by organizing your tasks across To Do, In Progress, and Done columns.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => handleOpenCreate('todo')}
                className="bg-[#0079BF] hover:bg-[#026AA7] text-white shadow-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create your first task
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Column Filter Tabs (visible only on small mobile viewports < 768px) */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg md:hidden overflow-x-auto">
          <button
            type="button"
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              mobileTab === 'all'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            All ({tasks.length})
          </button>
          {COLUMNS.map((col) => (
            <button
              key={col.status}
              type="button"
              onClick={() => setMobileTab(col.status)}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                mobileTab === col.status
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {col.title} ({grouped[col.status].length})
            </button>
          ))}
        </div>

        {/* Kanban Columns Grid (3 columns on lg 1024px+, 2 columns on md 768px, 1 column on mobile 375px) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          {COLUMNS.map((col) => {
            const isHiddenOnMobile = mobileTab !== 'all' && mobileTab !== col.status

            return (
              <div
                key={col.status}
                className={`${isHiddenOnMobile ? 'hidden md:block' : 'block'}`}
              >
                <Column
                  status={col.status}
                  title={col.title}
                  tasks={grouped[col.status]}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onQuickAdd={(status) => handleOpenCreate(status)}
                />
              </div>
            )
          })}
        </div>

        {/* Floating Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[300px] rotate-2 scale-105 shadow-2xl opacity-95 pointer-events-none cursor-grabbing">
              <TaskCard task={activeTask} onSelect={() => {}} />
            </div>
          ) : null}
        </DragOverlay>

        {/* Modal: Create Task */}
        <CreateTaskModal
          open={createOpen}
          initialStatus={createInitialStatus}
          onClose={() => setCreateOpen(false)}
          onCreated={(task) => {
            setTasks((prev) => [...prev, task])
          }}
        />

        {/* Detail Slide-over Panel */}
        {selectedTask && (
          <TaskDetailPanel
            key={selectedTask.id}
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdated={(updatedTask) => {
              setTasks((prev) =>
                prev.map((item) =>
                  item.id === updatedTask.id ? updatedTask : item
                )
              )
              setSelectedTask(updatedTask)
            }}
            onArchived={(id) => {
              setTasks((prev) => prev.filter((item) => item.id !== id))
            }}
            onRestored={(restoredTask) => {
              setTasks((prev) => [...prev, restoredTask])
            }}
          />
        )}
        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          open={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
        />
      </div>
    </DndContext>
  )
}
