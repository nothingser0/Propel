import { z } from 'zod'

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done'])
export const taskPrioritySchema = z.enum(['high', 'medium', 'low'])

const deadlineSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  })

export const createTaskFormSchema = z.object({
  title: z.string().min(3, 'Title must be 3-200 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema.optional(),
  deadline: z.string().optional(),
})

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be 3-200 characters').max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: taskPrioritySchema,
  status: taskStatusSchema.optional().default('todo'),
  deadline: deadlineSchema,
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  deadline: deadlineSchema,
  position: z.number().int().optional(),
  is_archived: z.boolean().optional(),
})

export const moveTaskSchema = z.object({
  status: taskStatusSchema,
  position: z.number().int().min(0),
})

export type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
