import { useState, useRef, useEffect } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { FiCalendar } from 'react-icons/fi'
import 'react-day-picker/style.css'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChangeStart: (date: string) => void
  onChangeEnd: (date: string) => void
}

export function DateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      // カレンダーの高さ約280px + 余裕を持たせる
      setShowAbove(spaceBelow < 500)
    }
    setIsOpen(!isOpen)
  }

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date())
    } catch {
      return undefined
    }
  }

  const selected: DateRange = {
    from: parseDate(startDate),
    to: parseDate(endDate),
  }

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChangeStart('')
      onChangeEnd('')
      return
    }

    if (range.from) {
      onChangeStart(format(range.from, 'yyyy-MM-dd'))
    }

    if (range.to) {
      onChangeEnd(format(range.to, 'yyyy-MM-dd'))
    } else {
      onChangeEnd('')
    }
  }

  const displayText = () => {
    if (startDate && endDate) {
      return `${format(parseDate(startDate)!, 'M/d')} - ${format(parseDate(endDate)!, 'M/d')}`
    }
    if (startDate) {
      return `${format(parseDate(startDate)!, 'M/d')} - 終了日を選択`
    }
    return '日付を選択'
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
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-left border border-gray-300 rounded hover:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
        <span className={startDate ? 'text-gray-900 text-xs' : 'text-gray-400 text-xs'}>
          {displayText()}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute z-50 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 ${showAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <DayPicker
            mode="range"
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
