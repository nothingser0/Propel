import { fail, ok, zodErrors } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchema } from '@/lib/validators/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('already') || message.includes('registered')) {
      return fail('Email already registered. Login instead.', 400)
    }
    return fail(error.message, 400)
  }

  return ok({ id: data.user.id, email: data.user.email }, 'Created successfully', 201)
}
