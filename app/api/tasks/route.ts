import { createTaskSchema } from '@/lib/validators/task'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = auth.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('is_archived', false)
    .order('position', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return fail(error.message, 500)
  return ok(data)
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const { data: last } = await auth.supabase
    .from('tasks')
    .select('position')
    .eq('user_id', auth.user.id)
    .eq('status', 'todo')
    .eq('is_archived', false)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await auth.supabase
    .from('tasks')
    .insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      deadline: parsed.data.deadline,
      status: 'todo',
      position: (last?.position ?? -1) + 1,
    })
    .select()
    .single()

  if (error) return fail(error.message, 500)
  return ok(data, 'Created successfully', 201)
}
