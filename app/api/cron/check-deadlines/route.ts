import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Verify Bearer token against CRON_SECRET if configured
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && expectedSecret !== 'your-random-secret-for-cron' && expectedSecret !== 'dev-cron-secret-change-in-prod') {
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ message: 'Unauthorized cron request' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const admin = createAdminClient()

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString()

  let highRiskCount = 0
  let atRiskCount = 0
  let clearedCount = 0

  // 1. Find and flag High Risk tasks: deadline < now + 24h AND status = 'todo'
  const { data: highRiskTasks } = await admin
    .from('tasks')
    .select('id, title, deadline, status')
    .eq('is_archived', false)
    .eq('status', 'todo')
    .not('deadline', 'is', null)
    .lte('deadline', in24h)

  if (highRiskTasks && highRiskTasks.length > 0) {
    const highRiskIds = highRiskTasks.map((t) => t.id)
    await admin
      .from('tasks')
      .update({ risk_level: 'high_risk' })
      .in('id', highRiskIds)
    highRiskCount = highRiskIds.length
  }

  // 2. Find and flag At Risk tasks: deadline < now + 72h AND status = 'in_progress'
  const { data: atRiskTasks } = await admin
    .from('tasks')
    .select('id, title, deadline, status, subtasks(id, is_done)')
    .eq('is_archived', false)
    .eq('status', 'in_progress')
    .not('deadline', 'is', null)
    .lte('deadline', in72h)

  if (atRiskTasks && atRiskTasks.length > 0) {
    // Flag if 0 subtasks completed or no subtasks
    const flaggedIds = atRiskTasks
      .filter((task: any) => {
        const subtasks = task.subtasks || []
        const completed = subtasks.filter((s: any) => s.is_done).length
        return completed === 0
      })
      .map((t) => t.id)

    if (flaggedIds.length > 0) {
      await admin
        .from('tasks')
        .update({ risk_level: 'at_risk' })
        .in('id', flaggedIds)
      atRiskCount = flaggedIds.length
    }
  }

  // 3. Clear risk_level for completed tasks or tasks with comfortable deadlines (> 72h)
  const { data: safeTasks } = await admin
    .from('tasks')
    .select('id')
    .or(`status.eq.done,deadline.is.null,deadline.gt.${in72h}`)
    .not('risk_level', 'is', null)

  if (safeTasks && safeTasks.length > 0) {
    const safeIds = safeTasks.map((t) => t.id)
    await admin
      .from('tasks')
      .update({ risk_level: null })
      .in('id', safeIds)
    clearedCount = safeIds.length
  }

  return new Response(
    JSON.stringify({
      data: {
        timestamp: now.toISOString(),
        flaggedHighRisk: highRiskCount,
        flaggedAtRisk: atRiskCount,
        cleared: clearedCount,
      },
      message: 'Deadline risk check completed successfully',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
