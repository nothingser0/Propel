export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskRiskLevel = 'high_risk' | 'at_risk' | null

export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type Subtask = {
  id: string
  task_id: string
  title: string
  is_done: boolean
  estimated_minutes: number | null
  position: number
  created_at: string
}

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
  subtasks?: Subtask[]
  subtask_count?: number
  subtasks_done?: number
  tags?: Tag[]
}

export type TimeEntry = {
  id: string
  user_id: string
  task_id: string | null
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  note: string | null
  created_at: string
  task?: Pick<Task, 'id' | 'title'> | null
}
