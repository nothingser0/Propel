export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskRiskLevel = 'high_risk' | 'at_risk' | null

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  deadline: string | null
  position: number
  risk_level: TaskRiskLevel
  is_archived: boolean
  created_at: string
  updated_at: string
}
