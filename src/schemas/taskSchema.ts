import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
}).superRefine((data, ctx) => {
  const hasAnyData = data.title || data.startDate || data.endDate
  if (hasAnyData) {
    if (!data.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'タスク名を入力してください',
        path: ['title'],
      })
    }
    if (!data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '開始日を選択してください',
        path: ['startDate'],
      })
    }
    if (!data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '終了日を選択してください',
        path: ['endDate'],
      })
    }
  }
})

export const milestoneDateSchema = z.object({
  date: z.string(),
})

export const taskListSchema = z.object({
  tasks: z.array(taskSchema),
  releaseJudgmentDates: z.array(milestoneDateSchema),
  releaseDates: z.array(milestoneDateSchema),
}).refine(
  (data) => {
    const hasCompleteTask = data.tasks.some(
      (task) => task.title && task.startDate && task.endDate
    )
    return hasCompleteTask
  },
  {
    message: '少なくとも1つのタスクを完全に入力してください',
    path: ['tasks'],
  }
)

export type TaskFormValues = z.infer<typeof taskListSchema>
