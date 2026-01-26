import { UseFormRegister, Control, useWatch, UseFormSetValue } from 'react-hook-form'
import { FiTrash2, FiMenu, FiPlus, FiCheck } from 'react-icons/fi'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskFormValues } from '../schemas/taskSchema'
import { DateRangePicker } from './DateRangePicker'

interface TaskRowProps {
  id: string
  index: number
  register: UseFormRegister<TaskFormValues>
  onRemove: () => void
  canRemove: boolean
  control: Control<TaskFormValues>
  setValue: UseFormSetValue<TaskFormValues>
  totalRows: number
  onAddRow: () => void
  onInsertBelow: () => void
}

const focusInput = (targetIndex: number, totalRows: number) => {
  if (targetIndex >= 0 && targetIndex < totalRows) {
    const input = document.querySelector<HTMLInputElement>(
      `input[data-task-index="${targetIndex}"]`
    )
    input?.focus()
  }
}

export function TaskRow({ id, index, register, onRemove, canRemove, control, setValue, totalRows, onAddRow, onInsertBelow }: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // IME変換中は無視
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Enter') {
      e.preventDefault()
      if (index === totalRows - 1) {
        // 最後の行の場合、新しい行を追加
        onAddRow()
        setTimeout(() => {
          focusInput(index + 1, totalRows + 1)
        }, 0)
      } else {
        focusInput(index + 1, totalRows)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusInput(index + 1, totalRows)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusInput(index - 1, totalRows)
    }
  }

  const startDate = useWatch({
    control,
    name: `tasks.${index}.startDate`,
  })

  const endDate = useWatch({
    control,
    name: `tasks.${index}.endDate`,
  })

  const completed = useWatch({
    control,
    name: `tasks.${index}.completed`,
  })

  const toggleCompleted = () => {
    setValue(`tasks.${index}.completed`, !completed)
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 hover:bg-accent/5 group h-9 ${completed ? 'bg-gray-100' : ''}`}
    >
      <td className="p-1 w-6">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="ドラッグして並べ替え"
        >
          <FiMenu size={14} />
        </button>
      </td>
      <td className="p-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCompleted}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              completed
                ? 'bg-gray-500 border-gray-500 text-white'
                : 'border-gray-300 hover:border-accent'
            }`}
            title={completed ? '完了を解除' : '完了にする'}
          >
            {completed && <FiCheck size={12} />}
          </button>
          <input
            type="text"
            {...register(`tasks.${index}.title`)}
            placeholder="タスク名"
            data-task-index={index}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent ${
              completed ? 'text-gray-400 line-through' : ''
            }`}
          />
        </div>
      </td>
      <td className="p-1 w-28" colSpan={2}>
        <DateRangePicker
          startDate={startDate || ''}
          endDate={endDate || ''}
          onChangeStart={(date) => setValue(`tasks.${index}.startDate`, date)}
          onChangeEnd={(date) => setValue(`tasks.${index}.endDate`, date)}
        />
      </td>
      <td className="p-1">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onInsertBelow}
            className="p-1 text-gray-400 hover:text-accent"
            title="下に行を追加"
          >
            <FiPlus size={14} />
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500"
              title="削除"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
