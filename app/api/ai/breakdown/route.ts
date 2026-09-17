import { z } from 'zod'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'
import { generateSubtasks } from '@/lib/ai/client'

const aiBreakdownSchema = z.object({
  title: z.string().min(3, 'Title is required for AI breakdown').max(200),
  description: z.string().max(2000).optional().nullable(),
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = aiBreakdownSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  try {
    const subtasks = await generateSubtasks(
      parsed.data.title,
      parsed.data.description
    )

    return ok(subtasks, 'AI breakdown generated successfully')
  } catch (err: any) {
    return fail(
      err?.message || 'AI service unavailable, add subtasks manually.',
      504
    )
  }
}
