import { fail, requireUser } from '@/lib/api'

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const { data, error } = await auth.supabase
    .from('time_entries')
    .select('*, tasks(title)')
    .eq('user_id', auth.user.id)
    .order('start_time', { ascending: false })

  if (error) return fail(error.message, 500)

  const entries = data ?? []

  function formatDuration(seconds: number | null) {
    if (!seconds) return '00:00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
  }

  function escapeCsv(str: string | null | undefined) {
    if (str == null) return '""'
    const cleaned = String(str).replace(/"/g, '""')
    return `"${cleaned}"`
  }

  const headers = [
    'Entry ID',
    'Task Title',
    'Start Time',
    'End Time',
    'Duration Seconds',
    'Duration (HH:MM:SS)',
    'Note',
  ]

  const rows = entries.map((e) => {
    const taskTitle = (e.tasks as any)?.title || 'No Task'
    return [
      escapeCsv(e.id),
      escapeCsv(taskTitle),
      escapeCsv(e.start_time),
      escapeCsv(e.end_time || 'Running'),
      e.duration_seconds ?? 0,
      escapeCsv(formatDuration(e.duration_seconds)),
      escapeCsv(e.note || ''),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="propel-time-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
