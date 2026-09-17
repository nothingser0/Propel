import { fail, ok, requireUser, zodErrors } from '@/lib/api'
import { createSubtaskSchema, batchCreateSubtasksSchema } from '@/lib/validators/subtask'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id: taskId } = await params

  // Verify task belongs to user
  const { data: task } = await auth.supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!task) return fail('Task not found', 404)

  const { data: subtasks, error } = await auth.supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })

  if (error) return fail(error.message, 500)
  return ok(subtasks ?? [])
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id: taskId } = await params

  // Verify task belongs to user
  const { data: task } = await auth.supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (!task) return fail('Task not found', 404)

  const body = await request.json().catch(() => null)

  // Support both single subtask creation and batch subtasks (e.g. from AI breakdown)
  const isBatch = Array.isArray(body?.subtasks)

  if (isBatch) {
    const parsedBatch = batchCreateSubtasksSchema.safeParse(body)
    if (!parsedBatch.success) {
      return fail('Validation failed', 400, zodErrors(parsedBatch.error))
    }

    const { data: lastItem } = await auth.supabase
      .from('subtasks')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    let startPos = (lastItem?.position ?? -1) + 1
    const records = parsedBatch.data.subtasks.map((item, idx) => ({
      task_id: taskId,
      title: item.title,
      estimated_minutes: item.estimated_minutes ?? null,
      is_done: false,
      position: startPos + idx,
    }))

    const { data: created, error } = await auth.supabase
      .from('subtasks')
      .insert(records)
      .select()

    if (error) return fail(error.message, 500)
    return ok(created, 'Batch subtasks created', 201)
  }

  // Single subtask
  const parsed = createSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const { data: lastItem } = await auth.supabase
    .from('subtasks')
    .select('position')
    .eq('task_id', taskId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (lastItem?.position ?? -1) + 1

  const { data: subtask, error } = await auth.supabase
    .from('subtasks')
    .insert({
      task_id: taskId,
      title: parsed.data.title,
      estimated_minutes: parsed.data.estimated_minutes ?? null,
      is_done: false,
      position,
    })
    .select()
    .single()

  if (error) return fail(error.message, 500)
  return ok(subtask, 'Subtask created', 201)
}
