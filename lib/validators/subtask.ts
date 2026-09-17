import { z } from 'zod'

export const createSubtaskSchema = z.object({
  title: z.string().min(2, 'Subtask title must be at least 2 characters').max(200),
  estimated_minutes: z.number().int().min(0).max(999).optional().nullable(),
})

export const updateSubtaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  is_done: z.boolean().optional(),
  position: z.number().int().optional(),
  estimated_minutes: z.number().int().min(0).max(999).optional().nullable(),
})

export const batchCreateSubtasksSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().min(2).max(200),
      estimated_minutes: z.number().int().min(0).max(999).optional().nullable(),
    })
  ).min(1, 'At least one subtask required'),
})

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>
export type BatchCreateSubtasksInput = z.infer<typeof batchCreateSubtasksSchema>
