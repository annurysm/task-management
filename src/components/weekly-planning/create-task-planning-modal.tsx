'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Calendar, Users, Target } from 'lucide-react'

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

interface Objective {
  id: string
  title: string
  description: string | null
}

interface CreateTaskPlanningModalProps {
  organizationId: string
  currentWeek: Date
  onClose: () => void
  onRefresh: () => void
}

export function CreateTaskPlanningModal({ 
  organizationId, 
  currentWeek, 
  onClose, 
  onRefresh 
}: CreateTaskPlanningModalProps) {
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedObjective, setSelectedObjective] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<Date>(currentWeek)

  // Get week start (Sunday)
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getWeekEnd = (date: Date) => {
    const end = new Date(date)
    const day = end.getDay()
    const diff = end.getDate() - day + 6
    end.setDate(diff)
    end.setHours(23, 59, 59, 999)
    return end
  }

  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date)
    const end = getWeekEnd(date)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const weekStart = getWeekStart(selectedWeek)
  const weekStartISO = weekStart.toISOString().split('T')[0]

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedWeek(newWeek)
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    try {
      const [tasksRes, objectivesRes, teamsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch(`/api/objectives?organizationId=${organizationId}`),
        fetch('/api/teams')
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setAvailableTasks(tasksData)
      }

      if (objectivesRes.ok) {
        const objectivesData = await objectivesRes.json()
        setObjectives(objectivesData)
        // Auto-select first objective if available
        if (objectivesData.length > 0 && !selectedObjective) {
          setSelectedObjective(objectivesData[0].id)
        }
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

  const handleAddToWeek = async (task: Task) => {
    if (!selectedObjective) {
      alert('Please select an objective first')
      return
    }

    try {
      const response = await fetch(`/api/objectives/${selectedObjective}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          weekStartDate: weekStartISO,
          assignedTeam: task.team.name,
          isCommitted: false
        }),
      })

      if (response.ok) {
        onRefresh()
        onClose()
      } else {
        console.error('Failed to add task to week')
      }
    } catch (error) {
      console.error('Error adding task to week:', error)
    }
  }

  const filteredTasks = availableTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.team.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-4/5 xl:w-4/5 shadow-lg rounded-lg bg-white dark:bg-zinc-900 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Add Task to Weekly Planning</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Side - Available Tasks */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto">
            <div className="space-y-4">
              {/* Objective Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  <Target className="h-4 w-4 inline mr-1" />
                  Select Objective
                </label>
                <select
                  value={selectedObjective}
                  onChange={(e) => setSelectedObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Choose an objective...</option>
                  {objectives.map((objective) => (
                    <option key={objective.id} value={objective.id}>
                      {objective.title}
                    </option>
                  ))}
                </select>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Available Tasks</h3>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Task List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-zinc-100">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-zinc-400">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                            {task.team.name}
                          </span>
                          <span className="text-xs">{task.status.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToWeek(task)}
                        disabled={!selectedObjective}
                        className="ml-4 px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add to Week
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                    No tasks found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Week Planning Preview */}
          <div className="w-1/2 p-6 bg-gray-50 dark:bg-zinc-800 overflow-y-auto">
            <div className="space-y-4">
              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300"
                >
                  ←
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                    {formatWeekRange(selectedWeek)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Week Planning</p>
                </div>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300"
                >
                  →
                </button>
              </div>

              {/* Selected Objective Info */}
              {selectedObjective && (
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                  <h4 className="font-medium text-gray-900 dark:text-zinc-100 mb-1">Selected Objective</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {objectives.find(obj => obj.id === selectedObjective)?.title}
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to add tasks:</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Select an objective from the dropdown</li>
                  <li>2. Choose the week you want to plan for</li>
                  <li>3. Search and select tasks from the left panel</li>
                  <li>4. Click "Add to Week" to schedule the task</li>
                </ol>
              </div>

              {!selectedObjective && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please select an objective to start adding tasks to the weekly plan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}