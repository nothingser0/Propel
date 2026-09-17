'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Flame,
  LayoutDashboard,
  Calendar,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'

interface DashboardData {
  stats: {
    totalTasks: number
    completedThisWeek: number
    completedTotal: number
    completionRate: number
    timeTrackedThisWeekSeconds: number
    timeTrackedThisWeekHours: number
    atRiskCount: number
    isBurnoutRisk: boolean
  }
  weeklyTrend: {
    week: string
    dateRange: string
    completed: number
    hours: number
    seconds: number
  }[]
  urgentTasks: {
    id: string
    title: string
    status: string
    priority: string
    deadline: string | null
    risk_level: string | null
  }[]
}

export function DashboardOverview({ initialData }: { initialData: DashboardData }) {
  const { stats, weeklyTrend, urgentTasks } = initialData

  function formatHoursMinutes(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-[#0079BF]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Progress Dashboard
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Real-time analytics, task completion velocity, and workload health indicators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/board">
            <Button className="bg-[#0079BF] hover:bg-[#026AA7] text-white shadow-xs text-xs sm:text-sm">
              View Kanban Board
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Burnout Risk Banner */}
      {stats.isBurnoutRisk && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200 shadow-xs animate-in fade-in">
          <Flame className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              High Workload Alert (Burnout Risk Detected)
            </h3>
            <p className="mt-0.5 text-red-700 dark:text-red-400">
              You have tracked over 40 hours of focused work in a single week. To maintain quality and sustainable pace, consider taking a break or delegating subtasks.
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed This Week */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Completed This Week
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {stats.completedThisWeek} tasks
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Total {stats.completedTotal} of {stats.totalTasks} tasks done
          </p>
        </div>

        {/* Card 2: Active Time Tracked */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Time Tracked
            </span>
            <Clock className="h-4 w-4 text-[#0079BF]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {formatHoursMinutes(stats.timeTrackedThisWeekSeconds)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Tracked focus this week</p>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Completion Rate
            </span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {stats.completionRate}%
          </p>
          <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Card 4: Tasks at Risk */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Deadline Risk
            </span>
            <AlertTriangle
              className={`h-4 w-4 ${
                stats.atRiskCount > 0 ? 'text-amber-500 animate-pulse' : 'text-gray-400'
              }`}
            />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {stats.atRiskCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {stats.atRiskCount > 0 ? 'Tasks near deadline' : 'All deadlines on track'}
          </p>
        </div>
      </div>

      {/* 4-Week Trend Chart Section */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              4-Week Velocity &amp; Focus Trend
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Completed tasks vs tracked hours per week
            </p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                unit="h"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                yAxisId="left"
                dataKey="completed"
                name="Tasks Completed"
                fill="#0079BF"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hours"
                name="Hours Tracked"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Urgent & At-Risk Tasks List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Priority &amp; Urgent Tasks
          </h2>
          <Link
            href="/board"
            className="text-xs font-semibold text-[#0079BF] hover:underline flex items-center gap-1"
          >
            Go to Board <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {urgentTasks.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            No high-priority or at-risk tasks at the moment. Great job!
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {task.risk_level ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-200">
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
