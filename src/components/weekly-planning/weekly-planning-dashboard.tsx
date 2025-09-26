'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { TaskDetailsModal } from '@/components/kanban/task-details-modal'
import { CreateTaskPlanningModal } from './create-task-planning-modal'

interface Organization {
  id: string
  name: string
}

interface Objective {
  id: string
  title: string
  description: string | null
  organizationId: string
  organization: {
    id: string
    name: string
  }
  tasks: Array<{
    objectiveId: string
    taskId: string | null
    epicId: string | null
    weekStartDate: string | null
    weekPriority: number | null
    assignedTeam: string | null
    isCommitted: boolean
    task: any
    epic: any
  }>
}

export function WeeklyPlanningDashboard() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  
  // Weekly view state
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations])

  useEffect(() => {
    if (selectedOrgId) {
      fetchObjectives()
    }
  }, [selectedOrgId])

  const fetchData = async () => {
    try {
      const orgsResponse = await fetch('/api/organizations')
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchObjectives = async () => {
    try {
      let url = '/api/objectives'
      if (selectedOrgId) {
        url += `?organizationId=${selectedOrgId}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setObjectives(data)
      }
    } catch (error) {
      console.error('Error fetching objectives:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const getWeeklyTasks = () => {
    const weekStart = getWeekStart(currentWeek)
    const weekStartISO = weekStart.toISOString().split('T')[0]
    
    const weeklyTasks: { [teamName: string]: any[] } = {}
    
    objectives.forEach(objective => {
      objective.tasks.forEach(objTask => {
        if (objTask.weekStartDate && objTask.task) {
          // Convert the weekStartDate to ISO string for comparison
          const taskWeekStartISO = new Date(objTask.weekStartDate).toISOString().split('T')[0]
          
          if (taskWeekStartISO === weekStartISO) {
            const teamName = objTask.assignedTeam || objTask.task.team?.name || 'Unassigned'
            if (!weeklyTasks[teamName]) {
              weeklyTasks[teamName] = []
            }
            weeklyTasks[teamName].push({
              ...objTask,
              objectiveTitle: objective.title
            })
          }
        }
      })
    })
    
    return weeklyTasks
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const weeklyTasks = getWeeklyTasks()

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Organization Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="organization" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Organization:
            </label>
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Task Button */}
        {selectedOrgId && (
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Task to Plan
          </button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-zinc-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Week of {formatWeekRange(currentWeek)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400">Weekly Sync Planning</p>
        </div>
        <button
          onClick={() => navigateWeek('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-zinc-300"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekly Tasks Table */}
      {Object.keys(weeklyTasks).length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Team / Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Objective
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Commitment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(weeklyTasks).map(([teamName, tasks]) => (
                  <React.Fragment key={teamName}>
                    {/* Team Header Row */}
                    <tr className="bg-gray-25 dark:bg-zinc-800">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {teamName}
                          </span>
                          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-xs font-medium px-2 py-1 rounded-full">
                            {tasks.length} tasks
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Team Tasks */}
                    {tasks.map((task, index) => (
                      <tr key={`${teamName}-task-${task.taskId || index}`} className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => setSelectedTask(task)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-1 h-8 bg-indigo-500 rounded-full mr-3"></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                {task.task.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {task.task.assignee ? (
                              <>
                                <img
                                  className="h-8 w-8 rounded-full mr-3"
                                  src={
                                    task.task.assignee.image?.startsWith('https://lh3.googleusercontent.com/')
                                      ? `/api/proxy/image?url=${encodeURIComponent(task.task.assignee.image)}`
                                      : task.task.assignee.image || '/default-avatar.svg'
                                  }
                                  alt={task.task.assignee.name || task.task.assignee.email}
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg'
                                  }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                    {task.task.assignee.name || task.task.assignee.email}
                                  </div>
                                  {task.task.assignee.name && (
                                    <div className="text-sm text-gray-500 dark:text-zinc-400">
                                      {task.task.assignee.email}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center text-gray-500 dark:text-zinc-400">
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center mr-3">
                                  <Users className="h-4 w-4" />
                                </div>
                                <span className="text-sm">Unassigned</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-zinc-100">
                            {task.objectiveTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.weekPriority ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                              Priority {task.weekPriority}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.task.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            task.task.status === 'IN_PROGRESS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-zinc-400'
                          }`}>
                            {task.task.status.replace('_', ' ').toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.isCommitted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                              ✓ Committed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-zinc-400">
                              Planned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No tasks planned for this week</h3>
          <p className="text-gray-600 dark:text-zinc-400">Plan tasks for this week in the objectives view</p>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={{
            id: selectedTask.task.id,
            title: selectedTask.task.title,
            description: selectedTask.task.description || '',
            status: selectedTask.task.status,
            priority: selectedTask.task.priority,
            assignee: selectedTask.task.assignee ? {
              name: selectedTask.task.assignee.name || selectedTask.task.assignee.email,
              avatar: selectedTask.task.assignee.image?.startsWith('https://lh3.googleusercontent.com/')
                ? `/api/proxy/image?url=${encodeURIComponent(selectedTask.task.assignee.image)}`
                : selectedTask.task.assignee.image || '/default-avatar.svg'
            } : null,
            estimation: selectedTask.task.estimation || 0,
            epic: selectedTask.epic ? {
              id: selectedTask.epic.id,
              title: selectedTask.epic.title,
              status: selectedTask.epic.status
            } : null,
            labels: selectedTask.task.labels?.map((label: any) => ({
              id: label.id,
              name: label.name,
              color: label.color
            })) || []
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Create Task Planning Modal */}
      {showCreateTaskModal && selectedOrgId && (
        <CreateTaskPlanningModal
          organizationId={selectedOrgId}
          currentWeek={currentWeek}
          onClose={() => setShowCreateTaskModal(false)}
          onRefresh={fetchObjectives}
        />
      )}
    </div>
  )
}