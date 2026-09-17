'use client'

import { useEffect } from 'react'
import { Square, Play, Clock } from 'lucide-react'
import { useTimerStore } from '@/lib/stores/timer-store'
import { useToast } from '@/hooks/use-toast'

export function TimerTicker() {
  const { toast } = useToast()
  const {
    activeEntry,
    activeTaskTitle,
    elapsedSeconds,
    isRunning,
    tick,
    stopTimer,
    syncActiveTimer,
  } = useTimerStore()

  useEffect(() => {
    syncActiveTimer()
  }, [syncActiveTimer])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, tick])

  function formatHHMMSS(totalSecs: number) {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
  }

  async function handleStop() {
    try {
      await stopTimer()
      toast({
        title: 'Timer stopped',
        description: `Logged ${formatHHMMSS(elapsedSeconds)} for ${activeTaskTitle || 'task'}.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to stop timer',
      })
    }
  }

  if (!isRunning || !activeEntry) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-white/95 dark:bg-gray-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-sm font-bold tracking-wider text-gray-900 dark:text-gray-100">
            {formatHHMMSS(elapsedSeconds)}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
            {activeTaskTitle || 'Active Task'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStop}
        className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors shadow-xs"
        title="Stop timer and log duration"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop
      </button>
    </div>
  )
}
