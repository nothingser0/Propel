import { z } from 'zod'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'

const createTimeEntrySchema = z.object({
  task_id: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  start_time: z.string().datetime().optional(),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const runningOnly = searchParams.get('running') === 'true'

  let query = auth.supabase
    .from('time_entries')
    .select('*, tasks(id, title)')
    .eq('user_id', auth.user.id)
    .order('start_time', { ascending: false })

  if (taskId) query = query.eq('task_id', taskId)
  if (from) query = query.gte('start_time', from)
  if (to) query = query.lte('start_time', to)
  if (runningOnly) query = query.is('end_time', null)

  const { data, error } = await query
  if (error) return fail(error.message, 500)

  return ok(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = createTimeEntrySchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const now = new Date().toISOString()
  const startTime = parsed.data.start_time || now

  // Stop any currently running timers for this user first
  const { data: runningTimers } = await auth.supabase
    .from('time_entries')
    .select('id, start_time')
    .eq('user_id', auth.user.id)
    .is('end_time', null)

  if (runningTimers && runningTimers.length > 0) {
    for (const running of runningTimers) {
      const startMs = new Date(running.start_time).getTime()
      const endMs = new Date(now).getTime()
      const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000))

      await auth.supabase
        .from('time_entries')
        .update({
          end_time: now,
          duration_seconds: durationSeconds,
        })
        .eq('id', running.id)
    }
  }

  // Create new timer entry
  const { data, error } = await auth.supabase
    .from('time_entries')
    .insert({
      user_id: auth.user.id,
      task_id: parsed.data.task_id || null,
      note: parsed.data.note || null,
      start_time: startTime,
      end_time: null,
      duration_seconds: null,
    })
    .select('*, tasks(id, title)')
    .single()

  if (error) return fail(error.message, 500)
  return ok(data, 'Timer started', 201)
}
