import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { FiPlus, FiMinus, FiPlay, FiRefreshCw, FiDatabase } from 'react-icons/fi'
import { Task, MilestoneDates, milestoneColors } from '../types/task'
import { taskListSchema, TaskFormValues } from '../schemas/taskSchema'
import { TaskRow } from './TaskRow'
import { MilestoneDateRow } from './MilestoneDateRow'

interface TaskInputFormProps {
  onGenerate: (tasks: Task[], milestones: MilestoneDates) => void
}

const createEmptyTask = (): Task => ({
  id: uuidv4(),
  title: '',
  startDate: '',
  endDate: '',
})

interface FormValues extends TaskFormValues {
  releaseJudgmentDates: { date: string }[]
  releaseDates: { date: string }[]
}

export function TaskInputForm({ onGenerate }: TaskInputFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(taskListSchema),
    defaultValues: {
      tasks: Array(5).fill(null).map(() => createEmptyTask()),
      releaseJudgmentDates: [{ date: '' }],
      releaseDates: [{ date: '' }],
    },
  })

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({
    control,
    name: 'tasks',
  })

  const { fields: judgmentFields, append: appendJudgment, remove: removeJudgment } = useFieldArray({
    control,
    name: 'releaseJudgmentDates',
  })

  const { fields: releaseFields, append: appendRelease, remove: removeRelease } = useFieldArray({
    control,
    name: 'releaseDates',
  })

  const onSubmit = (data: FormValues) => {
    const validTasks = data.tasks.filter(
      (task) => task.title && task.startDate && task.endDate
    )
    if (validTasks.length > 0) {
      const milestones: MilestoneDates = {
        releaseJudgmentDates: data.releaseJudgmentDates
          .map((d) => d.date)
          .filter((d) => d !== ''),
        releaseDates: data.releaseDates
          .map((d) => d.date)
          .filter((d) => d !== ''),
      }
      onGenerate(validTasks, milestones)
    }
  }

  const addTaskRow = () => {
    appendTask(createEmptyTask())
  }

  const removeLastRow = () => {
    if (taskFields.length > 1) {
      removeTask(taskFields.length - 1)
    }
  }

  const resetAll = () => {
    reset({
      tasks: Array(5).fill(null).map(() => createEmptyTask()),
      releaseJudgmentDates: [{ date: '' }],
      releaseDates: [{ date: '' }],
    })
  }

  const loadTestData = () => {
    const today = new Date()
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    const addDays = (date: Date, days: number) => {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }

    reset({
      tasks: [
        { id: uuidv4(), title: '要件定義', startDate: formatDate(today), endDate: formatDate(addDays(today, 2)) },
        { id: uuidv4(), title: '設計', startDate: formatDate(addDays(today, 2)), endDate: formatDate(addDays(today, 4)) },
        { id: uuidv4(), title: '実装', startDate: formatDate(addDays(today, 4)), endDate: formatDate(addDays(today, 8)) },
        { id: uuidv4(), title: 'テスト', startDate: formatDate(addDays(today, 8)), endDate: formatDate(addDays(today, 10)) },
        { id: uuidv4(), title: 'ドキュメント作成', startDate: formatDate(addDays(today, 9)), endDate: formatDate(addDays(today, 11)) },
      ],
      releaseJudgmentDates: [{ date: formatDate(addDays(today, 11)) }],
      releaseDates: [{ date: formatDate(addDays(today, 13)) }],
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
      <div className="h-10 px-3 border-b border-accent/20 bg-accent/5 flex items-center">
        <h2 className="text-sm font-bold text-accent-dark">タスク入力</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-40 bg-accent text-white">
            <tr>
              <th className="p-2 text-left font-medium">タスク名</th>
              <th className="p-2 text-left font-medium w-28" colSpan={2}>期間</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {taskFields.map((field, index) => (
              <TaskRow
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                onRemove={() => removeTask(index)}
                canRemove={taskFields.length > 1}
                control={control}
                setValue={setValue}
              />
            ))}
          </tbody>
        </table>
        {(errors.tasks?.message || errors.tasks?.root?.message) && (
          <p className="text-red-500 text-xs px-2 py-1">
            {errors.tasks?.message || errors.tasks?.root?.message}
          </p>
        )}
      </div>

      <div className="border-t border-accent/20">
        <div className="px-3 py-2 bg-accent/5">
          <h3 className="text-xs font-bold text-accent-dark mb-2">マイルストーン</h3>

          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: milestoneColors.releaseJudgmentDate }}
              ></span>
              <label className="text-xs font-medium">リリース判定日</label>
              <button
                type="button"
                onClick={() => appendJudgment({ date: '' })}
                className="ml-auto p-1 text-accent hover:bg-accent/10 rounded transition-colors"
              >
                <FiPlus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {judgmentFields.map((field, index) => (
                <MilestoneDateRow
                  key={field.id}
                  index={index}
                  fieldName="releaseJudgmentDates"
                  control={control}
                  setValue={setValue}
                  onRemove={() => removeJudgment(index)}
                  canRemove={judgmentFields.length > 1}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: milestoneColors.releaseDate }}
              ></span>
              <label className="text-xs font-medium">リリース日</label>
              <button
                type="button"
                onClick={() => appendRelease({ date: '' })}
                className="ml-auto p-1 text-accent hover:bg-accent/10 rounded transition-colors"
              >
                <FiPlus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {releaseFields.map((field, index) => (
                <MilestoneDateRow
                  key={field.id}
                  index={index}
                  fieldName="releaseDates"
                  control={control}
                  setValue={setValue}
                  onRemove={() => removeRelease(index)}
                  canRemove={releaseFields.length > 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-accent/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addTaskRow}
            className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
            title="行追加"
          >
            <FiPlus size={18} />
          </button>
          <button
            type="button"
            onClick={removeLastRow}
            disabled={taskFields.length <= 1}
            className="p-2 text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="行削除"
          >
            <FiMinus size={18} />
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
            title="リセット"
          >
            <FiRefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={loadTestData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
            title="テストデータ"
          >
            <FiDatabase size={18} />
          </button>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded transition-colors"
        >
          <FiPlay size={16} />
          生成
        </button>
      </div>
    </form>
  )
}
