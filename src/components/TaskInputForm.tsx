import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { useRef } from 'react'
import { FiPlus, FiMinus, FiPlay, FiRefreshCw, FiArrowUp, FiUpload } from 'react-icons/fi'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
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

export function TaskInputForm({ onGenerate }: TaskInputFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskListSchema),
    defaultValues: {
      tasks: Array(5).fill(null).map(() => createEmptyTask()),
      releaseJudgmentDates: [{ date: '' }],
      releaseDates: [{ date: '' }],
    },
  })

  const { fields: taskFields, append: appendTask, remove: removeTask, move: moveTask, replace: replaceTasks, insert: insertTask } = useFieldArray({
    control,
    name: 'tasks',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = taskFields.findIndex((field) => field.id === active.id)
      const newIndex = taskFields.findIndex((field) => field.id === over.id)
      moveTask(oldIndex, newIndex)
    }
  }

  const { fields: judgmentFields, append: appendJudgment, remove: removeJudgment } = useFieldArray({
    control,
    name: 'releaseJudgmentDates',
  })

  const { fields: releaseFields, append: appendRelease, remove: removeRelease } = useFieldArray({
    control,
    name: 'releaseDates',
  })

  const onSubmit = (data: TaskFormValues) => {
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

  const sortByStartDate = () => {
    const tasks = getValues('tasks')
    const sorted = [...tasks].sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return a.startDate.localeCompare(b.startDate)
    })
    replaceTasks(sorted)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleImportCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())

      // ヘッダー行をスキップ
      const dataLines = lines.slice(1)

      const importedTasks: Task[] = []
      const importedJudgmentDates: { date: string }[] = []
      const importedReleaseDates: { date: string }[] = []

      dataLines.forEach((line) => {
        const fields = parseCsvLine(line)

        // 新形式（種別,タスク名,開始日,期限日）
        if (fields.length >= 4) {
          const type = fields[0]
          const title = fields[1]
          const startDate = fields[2]
          const endDate = fields[3]

          if (type === 'task' && (title || startDate || endDate)) {
            importedTasks.push({
              id: uuidv4(),
              title,
              startDate,
              endDate,
            })
          } else if (type === 'releaseJudgment' && startDate) {
            importedJudgmentDates.push({ date: startDate })
          } else if (type === 'release' && startDate) {
            importedReleaseDates.push({ date: startDate })
          }
        }
        // 旧形式（タスク名,開始日,期限日）への後方互換性
        else if (fields.length === 3) {
          const title = fields[0]
          const startDate = fields[1]
          const endDate = fields[2]

          if (title || startDate || endDate) {
            importedTasks.push({
              id: uuidv4(),
              title,
              startDate,
              endDate,
            })
          }
        }
      })

      if (importedTasks.length > 0 || importedJudgmentDates.length > 0 || importedReleaseDates.length > 0) {
        reset({
          tasks: importedTasks.length > 0 ? importedTasks : [createEmptyTask()],
          releaseJudgmentDates: importedJudgmentDates.length > 0 ? importedJudgmentDates : [{ date: '' }],
          releaseDates: importedReleaseDates.length > 0 ? importedReleaseDates : [{ date: '' }],
        })
      }
    }
    reader.readAsText(file)

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
              <th className="p-2 w-6"></th>
              <th className="p-2 text-left font-medium">タスク名</th>
              <th className="p-2 text-left font-medium w-28" colSpan={2}>期間</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={taskFields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {taskFields.map((field, index) => (
                  <TaskRow
                    key={field.id}
                    id={field.id}
                    index={index}
                    register={register}
                    onRemove={() => removeTask(index)}
                    canRemove={taskFields.length > 1}
                    control={control}
                    setValue={setValue}
                    totalRows={taskFields.length}
                    onAddRow={addTaskRow}
                    onInsertBelow={() => insertTask(index + 1, createEmptyTask())}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
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

      <div className="p-3 border-t border-accent/20">
        {errors.tasks && (
          <p className="text-red-500 text-xs mb-2">
            日付、タイトルは必ず入力してください
          </p>
        )}
        <div className="flex justify-between items-center">
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
              onClick={sortByStartDate}
              className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
              title="開始日でソート"
            >
              <FiArrowUp size={18} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
              title="CSVインポート"
            >
              <FiUpload size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded transition-colors"
          >
            <FiPlay size={16} />
            生成
          </button>
        </div>
      </div>
    </form>
  )
}
