import { moveTaskSchema } from '@/lib/validators/task'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = moveTaskSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const { data, error } = await auth.supabase
    .from('tasks')
    .update({
      status: parsed.data.status,
      position: parsed.data.position,
    })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .maybeSingle()

  if (error) return fail(error.message, 500)
  if (!data) return fail('Resource not found.', 404)
  return ok(data)
}
