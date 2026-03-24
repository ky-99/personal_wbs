import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { useRef, useState } from 'react'
import { FiPlus, FiMinus, FiPlay, FiRefreshCw, FiArrowUp, FiUpload, FiChevronsUp, FiChevronDown, FiChevronRight } from 'react-icons/fi'
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
  onGenerate: (tasks: Task[], milestones: MilestoneDates, undecidedTasks: Task[]) => void
}

const createEmptyTask = (): Task => ({
  id: uuidv4(),
  title: '',
  startDate: '',
  endDate: '',
  completed: false,
  undecided: false,
})

export function TaskInputForm({ onGenerate }: TaskInputFormProps) {
  const [isMilestoneCollapsed, setIsMilestoneCollapsed] = useState(false)

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
      (task) => task.title && !task.undecided && task.startDate && task.endDate && !task.completed
    )
    const undecidedTasks = data.tasks.filter(
      (task) => task.title && task.undecided && !task.completed
    )
    if (validTasks.length > 0 || undecidedTasks.length > 0) {
      const milestones: MilestoneDates = {
        releaseJudgmentDates: data.releaseJudgmentDates
          .map((d) => d.date)
          .filter((d) => d !== ''),
        releaseDates: data.releaseDates
          .map((d) => d.date)
          .filter((d) => d !== ''),
      }
      onGenerate(validTasks, milestones, undecidedTasks)
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

  // 今日の日付を基準に、未完了タスクで開始日が今日より前のものを押し上げる
  const pushUpTasks = () => {
    const tasks = getValues('tasks')

    // 今日の日付を取得
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayStr = formatDate(today)

    // 未完了タスクで開始日が今日より前のものを押し上げる
    const updatedTasks = tasks.map((task) => {
      if (task.completed) return task
      if (!task.startDate || !task.endDate) return task

      if (task.startDate < todayStr) {
        // 開始日と終了日の差分（日数）を計算
        const startDate = new Date(task.startDate)
        const endDate = new Date(task.endDate)
        const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        // 新しい開始日を今日に設定
        const newStartDate = new Date(today)

        // 新しい終了日を計算
        const newEndDate = new Date(newStartDate)
        newEndDate.setDate(newEndDate.getDate() + duration)

        return {
          ...task,
          startDate: formatDate(newStartDate),
          endDate: formatDate(newEndDate),
        }
      }
      return task
    })

    replaceTasks(updatedTasks)
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

        // 新形式（種別,タスク名,開始日,期限日,完了）
        if (fields.length >= 4) {
          const type = fields[0]
          const title = fields[1]
          const startDate = fields[2]
          const endDate = fields[3]
          const completed = fields.length >= 5 ? fields[4] === 'true' : false

          if (type === 'task' && (title || startDate || endDate)) {
            const undecided = fields.length >= 6 ? fields[5] === 'true' : false
            importedTasks.push({
              id: uuidv4(),
              title,
              startDate,
              endDate,
              completed,
              undecided,
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
              completed: false,
              undecided: false,
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
          <button
            type="button"
            onClick={() => setIsMilestoneCollapsed(!isMilestoneCollapsed)}
            className="flex items-center gap-1 text-xs font-bold text-accent-dark mb-2 hover:text-accent transition-colors"
          >
            {isMilestoneCollapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
            マイルストーン
          </button>

          {!isMilestoneCollapsed && (
            <>
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
            </>
          )}
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
              onClick={pushUpTasks}
              className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
              title="未完了タスクを今日以降に押し上げ"
            >
              <FiChevronsUp size={18} />
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
