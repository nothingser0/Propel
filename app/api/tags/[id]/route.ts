import { fail, ok, requireUser } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { id } = await params

  const { error } = await auth.supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) return fail(error.message, 500)
  return ok({ id }, 'Tag deleted')
}
