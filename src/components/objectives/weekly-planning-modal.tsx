'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Calendar, Users } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  team: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  epic: {
    id: string
    title: string
  } | null
}

interface ObjectiveTask {
  objectiveId: string
  taskId: string | null
  epicId: string | null
  weekStartDate: string | null
  weekPriority: number | null
  assignedTeam: string | null
  isCommitted: boolean
  task: Task | null
}

interface Team {
  id: string
  name: string
}

interface WeeklyPlanningModalProps {
  objectiveId: string
  onClose: () => void
  onRefresh: () => void
}

export function WeeklyPlanningModal({ objectiveId, onClose, onRefresh }: WeeklyPlanningModalProps) {
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [objectiveTasks, setObjectiveTasks] = useState<ObjectiveTask[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())

  // Get week start (Sunday)
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const weekStart = getWeekStart(selectedWeek)
  const weekStartISO = weekStart.toISOString().split('T')[0]

  useEffect(() => {
    fetchData()
  }, [objectiveId])

  const fetchData = async () => {
    try {
      const [tasksRes, objTasksRes, teamsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch(`/api/objectives/${objectiveId}/tasks`),
        fetch('/api/teams')
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setAvailableTasks(tasksData)
      }

      if (objTasksRes.ok) {
        const objTasksData = await objTasksRes.json()
        setObjectiveTasks(objTasksData)
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/objectives/${objectiveId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          weekStartDate: weekStartISO,
          assignedTeam: task.team.name,
          isCommitted: false
        })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/objectives/${objectiveId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          weekStartDate: weekStartISO,
          ...updates
        })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const filteredTasks = availableTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.team.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const weeklyTasks = objectiveTasks.filter(objTask => {
    if (!objTask.weekStartDate || !objTask.task) return false
    const objTaskDate = new Date(objTask.weekStartDate).toISOString().split('T')[0]
    return objTaskDate === weekStartISO
  })

  // Group weekly tasks by team
  const tasksByTeam = weeklyTasks.reduce((acc: { [key: string]: ObjectiveTask[] }, task) => {
    const teamName = task.assignedTeam || task.task?.team?.name || 'Unassigned'
    if (!acc[teamName]) {
      acc[teamName] = []
    }
    acc[teamName].push(task)
    return acc
  }, {})

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedWeek(newWeek)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Weekly Planning</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-zinc-300 dark:hover:text-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-gray-600 dark:text-zinc-300 rounded-lg"
            >
              Previous Week
            </button>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {formatWeekRange(selectedWeek)}
              </h3>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-gray-600 dark:text-zinc-300 rounded-lg"
            >
              Next Week
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Available Tasks</h3>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Search tasks or teams..."
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTasks.map((task) => {
                  const isAlreadyAdded = weeklyTasks.some(wt => wt.task?.id === task.id)
                  return (
                    <div
                      key={task.id}
                      className={`p-3 border border-gray-200 dark:border-zinc-600 rounded-lg ${
                        isAlreadyAdded ? 'bg-gray-50 dark:bg-zinc-800 opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-zinc-100">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                              {task.team.name}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.status === 'DONE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-zinc-800/50 dark:text-zinc-400'
                            }`}>
                              {task.status.replace('_', ' ').toLowerCase()}
                            </span>
                          </div>
                        </div>
                        
                        {!isAlreadyAdded && (
                          <button
                            onClick={() => handleAddTask(task)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Add to Week
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weekly Planning */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                Week Planning ({weeklyTasks.length} tasks)
              </h3>

              {Object.keys(tasksByTeam).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(tasksByTeam).map(([teamName, tasks]) => (
                    <div key={teamName} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-zinc-100">{teamName}</h4>
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-medium px-2 py-1 rounded-full">
                          {tasks.length} tasks
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {tasks.map((objTask, index) => (
                          <div key={index} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 rounded p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 dark:text-zinc-100">{objTask.task?.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="number"
                                    placeholder="Priority"
                                    value={objTask.weekPriority || ''}
                                    onChange={(e) => handleUpdateTask(objTask.task?.id!, {
                                      weekPriority: parseInt(e.target.value) || null,
                                      assignedTeam: objTask.assignedTeam,
                                      isCommitted: objTask.isCommitted
                                    })}
                                    className="w-20 text-xs border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                                    min="1"
                                    max="10"
                                  />
                                  <label className="flex items-center gap-1 text-xs text-gray-700 dark:text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={objTask.isCommitted}
                                      onChange={(e) => handleUpdateTask(objTask.task?.id!, {
                                        weekPriority: objTask.weekPriority,
                                        assignedTeam: objTask.assignedTeam,
                                        isCommitted: e.target.checked
                                      })}
                                      className="rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-orange-500 dark:bg-zinc-800"
                                    />
                                    Committed
                                  </label>
                                </div>
                              </div>
                              
                              <span className={`text-xs px-2 py-1 rounded ${
                                objTask.task?.status === 'DONE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                objTask.task?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-gray-100 text-gray-800 dark:bg-zinc-800/50 dark:text-zinc-400'
                              }`}>
                                {objTask.task?.status?.replace('_', ' ').toLowerCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <Calendar className="h-8 w-8 text-gray-400 dark:text-zinc-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-zinc-300">No tasks planned for this week</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Add tasks from the available list</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onRefresh()
                onClose()
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 dark:bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 dark:hover:bg-indigo-500"
            >
              Save Planning
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}