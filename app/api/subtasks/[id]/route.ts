import { fail, ok, requireUser, zodErrors } from '@/lib/api'
import { updateSubtaskSchema } from '@/lib/validators/subtask'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id: subtaskId } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  // Update via Supabase (RLS policy ensures only parent task owner can update)
  const { data, error } = await auth.supabase
    .from('subtasks')
    .update(parsed.data)
    .eq('id', subtaskId)
    .select()
    .maybeSingle()

  if (error) return fail(error.message, 500)
  if (!data) return fail('Subtask not found or unauthorized', 404)

  return ok(data)
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id: subtaskId } = await params

  // Delete via Supabase (RLS policy verifies ownership via parent task)
  const { error } = await auth.supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId)

  if (error) return fail(error.message, 500)
  return ok({ id: subtaskId }, 'Deleted')
}
