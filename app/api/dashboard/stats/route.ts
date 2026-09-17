import { fail, ok, requireUser } from '@/lib/api'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = now.getDay()
  const startOfCurrentWeek = new Date(startOfToday)
  startOfCurrentWeek.setDate(startOfToday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)) // Monday start

  // 1. Fetch all user tasks
  const { data: allTasks, error: tasksError } = await auth.supabase
    .from('tasks')
    .select('id, title, status, priority, deadline, risk_level, updated_at, created_at')
    .eq('user_id', auth.user.id)
    .eq('is_archived', false)

  if (tasksError) return fail(tasksError.message, 500)

  const tasks = allTasks ?? []
  const totalTasks = tasks.length
  const completedTasksTotal = tasks.filter((t) => t.status === 'done').length

  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updated = new Date(t.updated_at)
    return updated.getTime() >= startOfCurrentWeek.getTime()
  }).length

  const atRiskTasks = tasks.filter((t) => t.risk_level === 'high_risk' || t.risk_level === 'at_risk')

  const completionRate = totalTasks > 0 ? Math.round((completedTasksTotal / totalTasks) * 100) : 0

  // 2. Fetch time entries for the last 4 weeks (28 days)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const { data: timeEntries, error: timeError } = await auth.supabase
    .from('time_entries')
    .select('id, start_time, duration_seconds')
    .eq('user_id', auth.user.id)
    .gte('start_time', fourWeeksAgo.toISOString())

  if (timeError) return fail(timeError.message, 500)

  const entries = timeEntries ?? []

  // Sum time tracked this week
  const timeThisWeekSeconds = entries
    .filter((e) => new Date(e.start_time).getTime() >= startOfCurrentWeek.getTime())
    .reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

  // Compute 4-week trend blocks
  const weeklyTrend = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(startOfCurrentWeek)
    weekStart.setDate(startOfCurrentWeek.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const label = `Week ${4 - i}`
    const dateRangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

    // Count tasks completed in that week
    const completedCount = tasks.filter((t) => {
      if (t.status !== 'done') return false
      const time = new Date(t.updated_at).getTime()
      return time >= weekStart.getTime() && time < weekEnd.getTime()
    }).length

    // Sum hours tracked in that week
    const trackedSecs = entries
      .filter((e) => {
        const time = new Date(e.start_time).getTime()
        return time >= weekStart.getTime() && time < weekEnd.getTime()
      })
      .reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

    const trackedHours = Number((trackedSecs / 3600).toFixed(1))

    weeklyTrend.push({
      week: label,
      dateRange: dateRangeLabel,
      completed: completedCount,
      hours: trackedHours,
      seconds: trackedSecs,
    })
  }

  // Burnout check: logged > 40h (144,000s) in any of the recent 2 weeks
  const isBurnoutRisk = weeklyTrend.slice(-2).some((w) => w.seconds > 40 * 3600)

  return ok({
    stats: {
      totalTasks,
      completedThisWeek,
      completedTotal: completedTasksTotal,
      completionRate,
      timeTrackedThisWeekSeconds: timeThisWeekSeconds,
      timeTrackedThisWeekHours: Number((timeThisWeekSeconds / 3600).toFixed(1)),
      atRiskCount: atRiskTasks.length,
      isBurnoutRisk,
    },
    weeklyTrend,
    urgentTasks: tasks
      .filter((t) => t.status !== 'done' && (t.priority === 'high' || t.risk_level != null))
      .slice(0, 5),
  })
}
