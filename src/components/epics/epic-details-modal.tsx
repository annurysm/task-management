'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Save, Calendar, Users, CheckCircle, Clock, Plus } from 'lucide-react'
import { CreateTaskModal, TaskCreatePayload, TaskSubmissionResult } from '@/components/kanban/create-task-modal'
import { TaskDetailsModal } from '@/components/kanban/task-details-modal'

interface Epic {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  team: {
    id: string
    name: string
    organization: {
      id: string
      name: string
    }
  }
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    assignee: {
      id: string
      name: string | null
      email: string
    } | null
    subtasks: Array<{
      id: string
      title: string
      status: string
      assignee: {
        id: string
        name: string | null
        email: string
      } | null
    }>
  }>
  _count: {
    tasks: number
  }
}

interface TeamOption {
  id: string
  name: string
  organization: {
    id: string
    name: string
  }
}

interface EpicDetailsModalProps {
  epicId: string
  onClose: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function EpicDetailsModal({ 
  epicId, 
  onClose, 
  onUpdate, 
  onDelete, 
  onRefresh 
}: EpicDetailsModalProps) {
  const [epic, setEpic] = useState<Epic | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    dueDate: '',
    teamId: ''
  })
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchEpic()
  }, [epicId])

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchEpic = async () => {
    try {
      const response = await fetch(`/api/epics/${epicId}`)
      if (response.ok) {
        const data = await response.json()
        setEpic(data)
        setEditData({
          title: data.title,
          description: data.description || '',
          status: data.status,
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
          teamId: data.team?.id || ''
        })
      }
    } catch (error) {
      console.error('Error fetching epic:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSave = async () => {
    if (!epic) return

    setSaveError(null)
    try {
      await onUpdate(epic.id, {
        title: editData.title,
        description: editData.description,
        status: editData.status,
        dueDate: editData.dueDate || null,
        teamId: editData.teamId || epic.team.id
      })

      await fetchEpic() // Refresh the epic data
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update epic:', error)
      setSaveError(
        error instanceof Error ? error.message : 'Failed to update epic. Please try again.'
      )
    }
  }

  const handleDelete = async () => {
    if (!epic) return
    
    if (epic._count.tasks > 0) {
      alert('Cannot delete epic with existing tasks. Please reassign or delete tasks first.')
      return
    }
    
    if (confirm(`Are you sure you want to delete "${epic.title}"?`)) {
      await onDelete(epic.id)
      onClose()
    }
  }

  const handleCreateTask = async (taskData: TaskCreatePayload): Promise<TaskSubmissionResult> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          teamId: epic?.team.id,
          epicId: epic?.id
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorBody.error || 'Failed to create task'
        }
      }

      await fetchEpic() // Refresh epic data to show new task
      setShowCreateTask(false)
      onRefresh() // Refresh parent component
      return { success: true }
    } catch (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create task'
      }
    }
  }

  const handleAddTaskClick = () => {
    setShowCreateTask(true)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!epic) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6">
          <p className="text-red-600 dark:text-red-400">Epic not found</p>
          <button onClick={onClose} className="mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
            Close
          </button>
        </div>
      </div>
    )
  }

  const statusColors: { [key: string]: string } = {
    PLANNING: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-zinc-400',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    ON_HOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
  }

  const priorityColors: { [key: string]: string } = {
    LOW: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
  }

  const totalTasks = epic.tasks.length
  const completedTasks = epic.tasks.filter(task => task.status === 'DONE').length
  const totalSubtasks = epic.tasks.reduce((acc, task) => acc + task.subtasks.length, 0)
  const completedSubtasks = epic.tasks.reduce((acc, task) => 
    acc + task.subtasks.filter(subtask => subtask.status === 'DONE').length, 0)

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="text-xl font-semibold text-gray-900 dark:text-zinc-100 bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:border-orange-500 focus:outline-none w-full"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{epic.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                >
                  <Save className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setSaveError(null)
                    fetchEpic()
                  }}
                  className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSaveError(null)
                  setIsEditing(true)
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mx-6 mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
            {saveError}
          </div>
        )}

        <div className="p-6">
          {/* Epic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add epic description..."
                  />
                ) : (
                  <p className="text-gray-600 dark:text-zinc-400">
                    {epic.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-zinc-300">Progress</span>
                  <span className="text-gray-600 dark:text-zinc-400">
                    {completedTasks}/{totalTasks} tasks ({progressPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[epic.status]}`}>
                    {epic.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Due Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    <span>{epic.dueDate ? formatDate(epic.dueDate) : 'No due date'}</span>
                  </div>
                )}
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Team
                </label>
                {isEditing ? (
                  <select
                    value={editData.teamId}
                    onChange={(event) => setEditData({ ...editData, teamId: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((teamOption) => (
                      <option key={teamOption.id} value={teamOption.id}>
                        {teamOption.name} • {teamOption.organization?.name || 'Unknown Organization'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    <div className="font-medium">{epic.team?.name || 'Unknown Team'}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">{epic.team?.organization?.name || 'Unknown Organization'}</div>
                  </div>
                )}
              </div>

              {/* Created By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Created By
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                  <Users className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <span>{epic.createdBy?.name || epic.createdBy?.email || 'Unknown'}</span>
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Timeline
                </label>
                <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    <span>Created: {formatDate(epic.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    <span>Updated: {formatDate(epic.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-blue-900 dark:text-blue-400">{totalTasks}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Tasks</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-green-900 dark:text-green-400">{completedTasks}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-purple-900 dark:text-purple-400">{totalSubtasks}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Subtasks</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-orange-900 dark:text-orange-400">{completedSubtasks}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Done Subtasks</div>
            </div>
          </div>

          {/* Tasks List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Tasks ({totalTasks})</h3>
              <button 
                onClick={handleAddTaskClick}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>

            {epic.tasks.length > 0 ? (
              <div className="space-y-3">
                {epic.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-zinc-100">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority.toLowerCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
                          {task.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
                        {task.assignee && (
                          <span>Assigned to: {task.assignee.name || task.assignee.email}</span>
                        )}
                        {task.subtasks.length > 0 && (
                          <span>{task.subtasks.length} subtasks</span>
                        )}
                      </div>
                      {task.status === 'DONE' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
                <div className="text-gray-400 dark:text-zinc-500 mb-2">No tasks yet</div>
                <button 
                  onClick={handleAddTaskClick}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                >
                  Add the first task
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200 dark:border-zinc-700">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"
              disabled={totalTasks > 0}
            >
              Delete Epic
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && epic && (
        <CreateTaskModal
          teamId={epic.team.id}
          onClose={() => setShowCreateTask(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || '',
            status: selectedTask.status,
            priority: selectedTask.priority,
            assignee: selectedTask.assignee ? {
              name: selectedTask.assignee.name || selectedTask.assignee.email,
              avatar: selectedTask.assignee.image?.startsWith('https://lh3.googleusercontent.com/')
                ? `/api/proxy/image?url=${encodeURIComponent(selectedTask.assignee.image)}`
                : selectedTask.assignee.image || '/default-avatar.svg'
            } : null,
            estimation: selectedTask.estimation || 0,
            epic: {
              id: epic!.id,
              title: epic!.title,
              status: epic!.status
            },
            labels: selectedTask.labels?.map((label: any) => ({
              id: label.id,
              name: label.name,
              color: label.color
            })) || []
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
