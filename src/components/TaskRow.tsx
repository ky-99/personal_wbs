import { UseFormRegister, FieldErrors, Control, useWatch, useFormContext } from 'react-hook-form'
import { FiTrash2 } from 'react-icons/fi'
import { TaskFormValues } from '../schemas/taskSchema'
import { DateRangePicker } from './DateRangePicker'

interface TaskRowProps {
  index: number
  register: UseFormRegister<TaskFormValues>
  errors: FieldErrors<TaskFormValues>
  onRemove: () => void
  canRemove: boolean
  control: Control<TaskFormValues>
  setValue: (name: any, value: string) => void
}

export function TaskRow({ index, register, errors, onRemove, canRemove, control, setValue }: TaskRowProps) {
  const rowErrors = errors.tasks?.[index]

  const startDate = useWatch({
    control,
    name: `tasks.${index}.startDate`,
  })

  const endDate = useWatch({
    control,
    name: `tasks.${index}.endDate`,
  })

  return (
    <tr className="border-b border-gray-200 hover:bg-accent/5 group h-9">
      <td className="p-1">
        <input
          type="text"
          {...register(`tasks.${index}.title`)}
          placeholder="タスク名"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent"
        />
        {rowErrors?.title && (
          <p className="text-red-500 text-xs">{rowErrors.title.message}</p>
        )}
      </td>
      <td className="p-1 w-28" colSpan={2}>
        <DateRangePicker
          startDate={startDate || ''}
          endDate={endDate || ''}
          onChangeStart={(date) => setValue(`tasks.${index}.startDate`, date)}
          onChangeEnd={(date) => setValue(`tasks.${index}.endDate`, date)}
        />
        {(rowErrors?.startDate || rowErrors?.endDate) && (
          <p className="text-red-500 text-xs">
            {rowErrors?.startDate?.message || rowErrors?.endDate?.message}
          </p>
        )}
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
