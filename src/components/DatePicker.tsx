import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { FiCalendar } from 'react-icons/fi'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = '日付を選択',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date())
    } catch {
      return undefined
    }
  }

  const selected = parseDate(value)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setIsOpen(false)
    } else {
      onChange('')
    }
  }

  const displayText = () => {
    if (value) {
      return format(parseDate(value)!, 'M/d')
    }
    return placeholder
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-left border border-gray-300 rounded hover:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
        <span className={value ? 'text-gray-900 text-xs' : 'text-gray-400 text-xs'}>
          {displayText()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={ja}
            showOutsideDays
            numberOfMonths={1}
            style={{ fontSize: '12px' }}
            styles={{
              month_caption: { fontSize: '13px', fontWeight: 'bold' },
              weekday: { fontSize: '11px' },
              day: { width: '28px', height: '28px' },
              day_button: { width: '28px', height: '28px', fontSize: '11px' },
            }}
          />
        </div>
      )}
    </div>
  )
}
