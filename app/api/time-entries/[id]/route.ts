import { z } from 'zod'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'

const updateTimeEntrySchema = z.object({
  end_time: z.string().datetime().optional(),
  note: z.string().max(500).optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateTimeEntrySchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  // Get existing entry
  const { data: existing } = await auth.supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!existing) return fail('Time entry not found', 404)

  const endTime = parsed.data.end_time || new Date().toISOString()
  const startMs = new Date(existing.start_time).getTime()
  const endMs = new Date(endTime).getTime()
  const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000))

  const { data, error } = await auth.supabase
    .from('time_entries')
    .update({
      end_time: endTime,
      duration_seconds: durationSeconds,
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
    })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('*, tasks(id, title)')
    .single()

  if (error) return fail(error.message, 500)
  return ok(data, 'Timer stopped')
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id } = await params

  const { error } = await auth.supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) return fail(error.message, 500)
  return ok({ id }, 'Deleted')
}
