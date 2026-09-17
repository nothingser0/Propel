import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['high', 'medium', 'low']),
  due_date: z.string().datetime().optional(),
})

export const createTaskSchema = taskSchema.omit({ status: true })

export const updateTaskSchema = taskSchema.partial()

export type TaskInput = z.infer<typeof taskSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
