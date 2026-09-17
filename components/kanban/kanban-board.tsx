'use client'

import { useMemo, useState } from 'react'
import { Plus, Kanban as KanbanIcon, Layers, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Column } from '@/components/kanban/column'
import { CreateTaskModal } from '@/components/kanban/create-task-modal'
import { TaskDetailPanel } from '@/components/kanban/task-detail-panel'
import type { Task, TaskStatus } from '@/lib/types'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [createOpen, setCreateOpen] = useState(false)
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('todo')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [mobileTab, setMobileTab] = useState<'all' | TaskStatus>('all')

  const grouped = useMemo(() => {
    return COLUMNS.reduce<Record<TaskStatus, Task[]>>(
      (acc, col) => {
        acc[col.status] = tasks
          .filter((task) => task.status === col.status)
          .sort((a, b) => a.position - b.position)
        return acc
      },
      { todo: [], in_progress: [], done: [] }
    )
  }, [tasks])

  const isEmpty = tasks.length === 0

  function handleOpenCreate(status: TaskStatus = 'todo') {
    setCreateInitialStatus(status)
    setCreateOpen(true)
  }

  return (
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
          <Button
            onClick={() => handleOpenCreate('todo')}
            className="bg-[#0079BF] hover:bg-[#026AA7] text-white shadow-sm font-medium text-sm transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

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
          // On mobile, if a specific tab is chosen (not 'all'), hide other columns
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
              prev.map((item) => (item.id === updatedTask.id ? updatedTask : item))
            )
            setSelectedTask(updatedTask)
          }}
          onArchived={(id) => {
            setTasks((prev) => prev.filter((item) => item.id !== id))
          }}
        />
      )}
    </div>
  )
}
