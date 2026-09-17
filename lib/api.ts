import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export function ok<T>(data: T, message = 'Success', status = 200) {
  return NextResponse.json({ data, message }, { status })
}

export function fail(
  message: string,
  status: number,
  errors?: Record<string, string[]>
) {
  if (errors) {
    return NextResponse.json({ message, errors }, { status })
  }
  return NextResponse.json({ message }, { status })
}

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      supabase,
      response: fail('Unauthenticated.', 401),
    }
  }

  return { user, supabase, response: null }
}

export function zodErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form'
    if (!errors[key]) errors[key] = []
    errors[key].push(issue.message)
  }
  return errors
}
