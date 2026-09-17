import { TimeLogClient } from '@/components/time-log/time-log-client'
import { createClient } from '@/lib/supabase/server'
import type { TimeEntry } from '@/lib/types'

export default async function TimeLogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('time_entries')
    .select('*, tasks(id, title)')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  return <TimeLogClient initialEntries={(data ?? []) as TimeEntry[]} />
}
