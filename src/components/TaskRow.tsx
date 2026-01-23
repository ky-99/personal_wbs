import { UseFormRegister, Control, useWatch } from 'react-hook-form'
import { FiTrash2, FiMenu } from 'react-icons/fi'
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
  setValue: (name: any, value: string) => void
  totalRows: number
}

const focusNextInput = (currentIndex: number, totalRows: number) => {
  const nextIndex = currentIndex + 1
  if (nextIndex < totalRows) {
    const nextInput = document.querySelector<HTMLInputElement>(
      `input[data-task-index="${nextIndex}"]`
    )
    nextInput?.focus()
  }
}

export function TaskRow({ id, index, register, onRemove, canRemove, control, setValue, totalRows }: TaskRowProps) {
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
    // IME変換中のEnterは無視
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      focusNextInput(index, totalRows)
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

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-gray-200 hover:bg-accent/5 group h-9"
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
        <input
          type="text"
          {...register(`tasks.${index}.title`)}
          placeholder="タスク名"
          data-task-index={index}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent"
        />
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
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="削除"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}
