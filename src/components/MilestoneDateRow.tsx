import { Control, UseFormSetValue, useWatch } from 'react-hook-form'
import { FiX } from 'react-icons/fi'
import { DatePicker } from './DatePicker'

interface MilestoneDateRowProps {
  index: number
  fieldName: 'releaseJudgmentDates' | 'releaseDates'
  control: Control<any>
  setValue: UseFormSetValue<any>
  onRemove: () => void
  canRemove: boolean
}

export function MilestoneDateRow({
  index,
  fieldName,
  control,
  setValue,
  onRemove,
  canRemove,
}: MilestoneDateRowProps) {
  const dateValue = useWatch({
    control,
    name: `${fieldName}.${index}.date`,
  })

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1">
        <DatePicker
          value={dateValue || ''}
          onChange={(date) => setValue(`${fieldName}.${index}.date`, date)}
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  )
}
