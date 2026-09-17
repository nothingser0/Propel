import { create } from 'zustand'
import type { TimeEntry } from '@/lib/types'

interface TimerState {
  activeEntry: TimeEntry | null
  activeTaskTitle: string | null
  elapsedSeconds: number
  isRunning: boolean
  startTimer: (taskId: string | null, taskTitle?: string) => Promise<void>
  stopTimer: () => Promise<void>
  tick: () => void
  syncActiveTimer: () => Promise<void>
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeEntry: null,
  activeTaskTitle: null,
  elapsedSeconds: 0,
  isRunning: false,

  tick: () => {
    if (get().isRunning) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
    }
  },

  syncActiveTimer: async () => {
    try {
      const res = await fetch('/api/time-entries?running=true')
      if (!res.ok) return
      const json = await res.json()
      const entries: TimeEntry[] = json.data || []
      const running = entries[0]

      if (running) {
        const startMs = new Date(running.start_time).getTime()
        const nowMs = Date.now()
        const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000))
        const taskTitle = (running as any).tasks?.title || null

        set({
          activeEntry: running,
          activeTaskTitle: taskTitle,
          elapsedSeconds: elapsed,
          isRunning: true,
        })
      } else {
        set({
          activeEntry: null,
          activeTaskTitle: null,
          elapsedSeconds: 0,
          isRunning: false,
        })
      }
    } catch {
      // Ignore background sync errors
    }
  },

  startTimer: async (taskId: string | null, taskTitle?: string) => {
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      if (!res.ok) throw new Error('Failed to start timer')
      const json = await res.json()
      const entry: TimeEntry = json.data

      set({
        activeEntry: entry,
        activeTaskTitle: taskTitle || (entry as any).tasks?.title || null,
        elapsedSeconds: 0,
        isRunning: true,
      })
    } catch (err) {
      console.error('startTimer error:', err)
      throw err
    }
  },

  stopTimer: async () => {
    const { activeEntry } = get()
    if (!activeEntry) return

    try {
      await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end_time: new Date().toISOString() }),
      })

      set({
        activeEntry: null,
        activeTaskTitle: null,
        elapsedSeconds: 0,
        isRunning: false,
      })
    } catch (err) {
      console.error('stopTimer error:', err)
      throw err
    }
  },
}))
