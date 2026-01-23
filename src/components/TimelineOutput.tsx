import { FiDownload } from 'react-icons/fi'
import { Task, MilestoneDates, taskBarColor, milestoneColors } from '../types/task'
import { TimelineChart } from './TimelineChart'

interface TimelineOutputProps {
  tasks: Task[]
  milestones: MilestoneDates
}

export function TimelineOutput({ tasks, milestones }: TimelineOutputProps) {
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadCsv = () => {
    const headers = ['タスク名', '開始日', '期限日']
    const rows = tasks.map((task) => [
      task.title,
      task.startDate,
      task.endDate,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const bom = '\uFEFF'
    downloadFile(bom + csvContent, 'wbs-tasks.csv', 'text/csv;charset=utf-8')
  }

  const handleDownloadHtml = () => {
    const generateDays = () => {
      if (tasks.length === 0) return []
      const dates = tasks.map((t) => new Date(t.startDate))
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(minDate)
        d.setDate(d.getDate() + i)
        return d
      })
    }

    const days = generateDays()
    const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`
    const getDayOfWeek = (date: Date) => ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6

    const isTaskOnDay = (task: Task, day: Date) => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      return day >= taskStart && day <= taskEnd
    }

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>WBS タイムライン</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; background: #FFF5EB; padding: 20px; }
    table { border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 4px 8px; }
    th { background: #0891B2; color: white; }
    .weekend { background: #0E7490; }
    .task-cell { min-width: 28px; height: 36px; }
    .bar { height: 100%; background: ${taskBarColor}; opacity: 0.8; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th rowspan="2">タスク名</th>
        ${days.map(d => `<th class="${isWeekend(d) ? 'weekend' : ''}">${formatDate(d)}</th>`).join('')}
      </tr>
      <tr>
        ${days.map(d => `<th class="${isWeekend(d) ? 'weekend' : ''}" style="font-size:10px">${getDayOfWeek(d)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tasks.map((task) => `
        <tr>
          <td>${task.title}</td>
          ${days.map(d => `<td class="task-cell">${isTaskOnDay(task, d) ? '<div class="bar"></div>' : ''}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`
    downloadFile(html, 'wbs-timeline.html', 'text/html')
  }

  const handleDownloadSvg = () => {
    const generateDays = () => {
      if (tasks.length === 0) return []
      const dates = tasks.map((t) => new Date(t.startDate))
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(minDate)
        d.setDate(d.getDate() + i)
        return d
      })
    }

    const days = generateDays()
    const cellWidth = 30
    const rowHeight = 30
    const labelWidth = 120
    const headerHeight = 50
    const width = labelWidth + days.length * cellWidth
    const height = headerHeight + tasks.length * rowHeight

    const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

    const isTaskOnDay = (task: Task, day: Date) => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      return day >= taskStart && day <= taskEnd
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#FFF5EB"/>
  <rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#0891B2"/>
  <text x="10" y="30" fill="white" font-size="12" font-family="sans-serif">タスク名</text>
  ${days.map((d, i) => `<text x="${labelWidth + i * cellWidth + cellWidth / 2}" y="20" fill="white" font-size="9" text-anchor="middle" font-family="sans-serif">${formatDate(d)}</text>`).join('\n  ')}
  ${tasks.map((task, rowIndex) => {
    const y = headerHeight + rowIndex * rowHeight
    return `
  <rect x="0" y="${y}" width="${width}" height="${rowHeight}" fill="#fff"/>
  <text x="10" y="${y + 20}" fill="#333" font-size="11" font-family="sans-serif">${task.title.slice(0, 12)}</text>
  ${days.map((d, colIndex) => {
    if (isTaskOnDay(task, d)) {
      return `<rect x="${labelWidth + colIndex * cellWidth}" y="${y}" width="${cellWidth}" height="${rowHeight}" fill="${taskBarColor}" opacity="0.8"/>`
    }
    return ''
  }).join('\n  ')}`
  }).join('')}
  ${Array.from({ length: days.length + 1 }, (_, i) => `<line x1="${labelWidth + i * cellWidth}" y1="0" x2="${labelWidth + i * cellWidth}" y2="${height}" stroke="#ddd" stroke-width="1"/>`).join('\n  ')}
  ${Array.from({ length: tasks.length + 1 }, (_, i) => `<line x1="0" y1="${headerHeight + i * rowHeight}" x2="${width}" y2="${headerHeight + i * rowHeight}" stroke="#ddd" stroke-width="1"/>`).join('\n  ')}
</svg>`
    downloadFile(svg, 'wbs-timeline.svg', 'image/svg+xml')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 px-3 border-b border-accent/20 bg-accent/5 flex justify-between items-center">
        <h2 className="text-sm font-bold text-accent-dark">タイムライン</h2>
        {tasks.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              <FiDownload size={12} />
              SVG
            </button>
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              <FiDownload size={12} />
              HTML
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              <FiDownload size={12} />
              CSV
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <TimelineChart tasks={tasks} milestones={milestones} />
      </div>

      {tasks.length > 0 && (
        <div className="p-2 border-t border-accent/20 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: taskBarColor }}></span>
            <span>タスク</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: milestoneColors.releaseJudgmentDate }}></span>
            <span>リリース判定日</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: milestoneColors.releaseDate }}></span>
            <span>リリース日</span>
          </div>
        </div>
      )}
    </div>
  )
}
