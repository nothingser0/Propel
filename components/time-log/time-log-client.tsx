'use client'

import { useState } from 'react'
import {
  Clock,
  Download,
  Calendar,
  Trash2,
  Timer as TimerIcon,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { TimeEntry } from '@/lib/types'

interface TimeLogClientProps {
  initialEntries: TimeEntry[]
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatHoursMinutes(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function TimeLogClient({ initialEntries }: TimeLogClientProps) {
  const { toast } = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate statistics
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now.setDate(now.getDate() - dayOfWeek)).getTime()

  let totalTodaySecs = 0
  let totalWeekSecs = 0
  let allTotalSecs = 0

  for (const entry of entries) {
    const sec = entry.duration_seconds || 0
    const entryTime = new Date(entry.start_time).getTime()
    allTotalSecs += sec

    if (entryTime >= startOfToday) {
      totalTodaySecs += sec
    }
    if (entryTime >= startOfWeek) {
      totalWeekSecs += sec
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()

      setEntries((prev) => prev.filter((e) => e.id !== id))
      toast({ title: 'Entry deleted' })
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete entry' })
    }
  }

  function handleExportCsv() {
    setIsExporting(true)
    window.location.href = '/api/time-entries/export'
    setTimeout(() => setIsExporting(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <TimerIcon className="h-6 w-6 text-[#0079BF]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Time Log
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Track productivity, review focus sessions, and export timesheets for billing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCsv}
            disabled={isExporting || entries.length === 0}
            variant="outline"
            className="border-gray-300 dark:border-gray-700 shadow-2xs text-xs sm:text-sm"
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Today
            </span>
            <Clock className="h-4 w-4 text-[#0079BF]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {formatHoursMinutes(totalTodaySecs)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Time tracked since midnight</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              This Week
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {formatHoursMinutes(totalWeekSecs)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Weekly tracked volume</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              All Sessions
            </span>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {entries.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Total logged focus periods ({formatHoursMinutes(allTotalSecs)})
          </p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Logged Sessions ({entries.length})
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No time entries recorded yet
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Open any task card on your board and click &quot;Track Time&quot; to start timing your work.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/40 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Task</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time Period</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry) => {
                  const taskTitle = (entry as any).tasks?.title || 'General Focus'
                  const startDate = new Date(entry.start_time)
                  const isRunning = !entry.end_time

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                        {taskTitle}
                        {entry.note && (
                          <span className="block text-xs text-gray-400 truncate">
                            {entry.note}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        {startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {entry.end_time
                          ? new Date(entry.end_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Running'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold whitespace-nowrap">
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDuration(entry.duration_seconds)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
