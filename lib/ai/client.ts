export interface AISubtaskSuggestion {
  title: string
  estimatedMinutes?: number
}

const DEFAULT_TIMEOUT_MS = 15000

export async function generateSubtasks(
  title: string,
  description?: string | null
): Promise<AISubtaskSuggestion[]> {
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey === 'placeholder-openai-key') {
    // Return sensible fallback mock subtasks when key is not yet configured by user
    return [
      { title: `Define specifications for ${title}`, estimatedMinutes: 30 },
      { title: `Implement core logic and data model`, estimatedMinutes: 60 },
      { title: `Build UI components and state management`, estimatedMinutes: 45 },
      { title: `Write unit & integration tests`, estimatedMinutes: 30 },
      { title: `Review and verify edge cases`, estimatedMinutes: 20 },
    ]
  }

  const systemPrompt = `You are an expert agile engineering copilot. Your task is to break down a given task into 5 to 7 concrete, sequential, actionable subtasks.
Output ONLY a raw JSON array of objects with the following shape:
[
  { "title": "Subtask action", "estimatedMinutes": 30 }
]
Do not include markdown codeblocks, explanation, or greeting.`

  const userContent = `Task Title: ${title}\nDescription: ${description || 'No description provided'}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`AI Provider returned HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || '[]'
    const cleanJson = content.replace(/^```(json)?/, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleanJson)

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        title: String(item.title || 'Subtask').slice(0, 200),
        estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : 30,
      }))
    }

    throw new Error('AI returned empty subtasks')
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('AI service timed out after 15s')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
