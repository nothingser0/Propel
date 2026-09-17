import { z } from 'zod'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'

const createTagSchema = z.object({
  name: z.string().min(2, 'Tag name must be 2-20 characters').max(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code (e.g. #0079BF)').default('#6B7280'),
})

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { data, error } = await auth.supabase
    .from('tags')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('name', { ascending: true })

  if (error) return fail(error.message, 500)
  return ok(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = createTagSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const { data, error } = await auth.supabase
    .from('tags')
    .insert({
      user_id: auth.user.id,
      name: parsed.data.name.trim(),
      color: parsed.data.color,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return fail('A tag with this name already exists', 400)
    }
    return fail(error.message, 500)
  }

  return ok(data, 'Tag created', 201)
}
