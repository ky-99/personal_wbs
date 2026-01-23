import { useState } from 'react'
import { Task, MilestoneDates } from './types/task'
import { TaskInputForm } from './components/TaskInputForm'
import { TimelineOutput } from './components/TimelineOutput'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<MilestoneDates>({
    releaseDates: [],
    releaseJudgmentDates: [],
  })

  const handleGenerate = (newTasks: Task[], newMilestones: MilestoneDates) => {
    setTasks(newTasks)
    setMilestones(newMilestones)
  }

  const handleReset = () => {
    setTasks([])
    setMilestones({ releaseDates: [], releaseJudgmentDates: [] })
  }

  return (
    <div className="min-h-screen bg-skin">
      <header className="bg-accent text-white py-3">
        <div className="px-4">
          <h1 className="text-xl font-bold">Personal WBS</h1>
        </div>
      </header>

      <main className="flex h-[calc(100vh-52px)]">
        <div className="w-[30%] border-r border-accent/20 overflow-auto">
          <TaskInputForm onGenerate={handleGenerate} />
        </div>
        <div className="w-[70%] overflow-auto">
          <TimelineOutput tasks={tasks} milestones={milestones} onReset={handleReset} />
        </div>
      </main>
    </div>
  )
}

export default App
