import { useMemo } from 'react'
import { Task, MilestoneDates, taskBarColor, milestoneColors } from '../types/task'

interface TimelineChartProps {
  tasks: Task[]
  milestones: MilestoneDates
}

const DAYS_TO_SHOW = 30

export function TimelineChart({ tasks, milestones }: TimelineChartProps) {
  const { days } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return {
        days: Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
          const d = new Date(today)
          d.setDate(d.getDate() + i)
          return d
        }),
      }
    }

    const dates = tasks.map((t) => new Date(t.startDate))
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    minDate.setHours(0, 0, 0, 0)

    const daysArr = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const d = new Date(minDate)
      d.setDate(d.getDate() + i)
      return d
    })

    return { days: daysArr }
  }, [tasks])

  const getTaskBarPosition = (task: Task) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    taskStart.setHours(0, 0, 0, 0)
    taskEnd.setHours(0, 0, 0, 0)

    const firstDay = new Date(days[0])
    firstDay.setHours(0, 0, 0, 0)

    const startIndex = Math.max(0, Math.floor((taskStart.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)))
    const endIndex = Math.min(DAYS_TO_SHOW - 1, Math.floor((taskEnd.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)))

    if (startIndex > DAYS_TO_SHOW - 1 || endIndex < 0) return null

    return { startIndex, endIndex, span: endIndex - startIndex + 1 }
  }

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const getDayOfWeek = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    return dayNames[date.getDay()]
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const getMilestoneColor = (date: Date) => {
    const dateStr = formatDateToString(date)
    if (milestones.releaseDates.includes(dateStr)) {
      return milestoneColors.releaseDate
    }
    if (milestones.releaseJudgmentDates.includes(dateStr)) {
      return milestoneColors.releaseJudgmentDate
    }
    return null
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-accent text-white">
            <th rowSpan={2} className="border border-accent-dark p-1 text-left sticky left-0 bg-accent min-w-[120px]">
              タスク名
            </th>
            {days.map((day, i) => {
              const milestoneColor = getMilestoneColor(day)
              return (
                <th
                  key={`date-${i}`}
                  className={`border border-accent-dark px-0.5 py-0.5 text-center min-w-[28px] ${
                    isWeekend(day) && !milestoneColor ? 'bg-accent-dark' : ''
                  }`}
                  style={milestoneColor ? { backgroundColor: milestoneColor } : undefined}
                >
                  {formatDate(day)}
                </th>
              )
            })}
          </tr>
          <tr className="bg-accent text-white">
            {days.map((day, i) => {
              const milestoneColor = getMilestoneColor(day)
              return (
                <th
                  key={`dow-${i}`}
                  className={`border border-accent-dark px-0.5 py-0.5 text-center text-[10px] ${
                    isWeekend(day) && !milestoneColor ? 'bg-accent-dark' : ''
                  }`}
                  style={milestoneColor ? { backgroundColor: milestoneColor } : undefined}
                >
                  {getDayOfWeek(day)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td
                colSpan={DAYS_TO_SHOW + 1}
                className="border border-gray-300 p-8 text-center text-gray-400"
              >
                タスクを入力して「生成」をクリックしてください
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const barPos = getTaskBarPosition(task)
              return (
                <tr key={task.id} className="h-9 bg-white">
                  <td className="border border-gray-300 p-1 sticky left-0 bg-inherit font-medium truncate max-w-[120px]">
                    {task.title}
                  </td>
                  {days.map((day, colIndex) => {
                    const isInBar = barPos && colIndex >= barPos.startIndex && colIndex <= barPos.endIndex
                    const milestoneColor = getMilestoneColor(day)

                    return (
                      <td
                        key={colIndex}
                        className={`border-y border-gray-300 p-0 relative ${
                          colIndex === 0 ? 'border-l' : ''
                        } ${colIndex === DAYS_TO_SHOW - 1 ? 'border-r' : ''}`}
                        style={
                          milestoneColor && !isInBar
                            ? { backgroundColor: `${milestoneColor}30` }
                            : isWeekend(day) && !isInBar
                            ? { backgroundColor: '#f3f4f6' }
                            : undefined
                        }
                      >
                        {isInBar && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundColor: taskBarColor,
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
