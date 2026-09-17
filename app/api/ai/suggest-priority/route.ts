import { z } from 'zod'
import { fail, ok, requireUser, zodErrors } from '@/lib/api'
import type { TaskPriority } from '@/lib/types'

const suggestPrioritySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = suggestPrioritySchema.safeParse(body)
  if (!parsed.success) {
    return fail('Validation failed', 400, zodErrors(parsed.error))
  }

  const { title, description, deadline } = parsed.data
  const combinedText = `${title} ${description || ''}`.toLowerCase()

  let priority: TaskPriority = 'low'
  const reasons: string[] = []

  // Check deadline
  if (deadline) {
    const deadlineDate = new Date(deadline)
    if (!Number.isNaN(deadlineDate.getTime())) {
      const now = new Date()
      const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (diffHours <= 24) {
        priority = 'high'
        reasons.push('Due within 24 hours')
      } else if (diffHours <= 72) {
        priority = 'medium'
        reasons.push('Due within 3 days')
      } else {
        reasons.push('Due in more than 3 days')
      }
    }
  }

  // Check urgency keywords
  const urgentKeywords = [
    'urgent',
    'asap',
    'critical',
    'emergency',
    'immediately',
    'p0',
    'blocker',
    'high priority',
    'crucial',
  ]

  const matchedKeyword = urgentKeywords.find((kw) => combinedText.includes(kw))
  if (matchedKeyword) {
    reasons.push(`Contains urgency keyword "${matchedKeyword}"`)
    if (priority === 'low') {
      priority = 'medium'
    } else if (priority === 'medium') {
      priority = 'high'
    }
  }

  if (reasons.length === 0) {
    reasons.push('Standard priority based on general task scope')
    priority = 'medium'
  }

  return ok({
    priority,
    reason: reasons.join('; '),
  })
}
