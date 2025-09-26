'use client'

import { useState, useEffect } from 'react'
import { X, Clock, User, Tag, AlertCircle, Calendar, Edit, Save, Plus, Trash2, BookOpen, ExternalLink } from 'lucide-react'
import { EpicDetailsModal } from '@/components/epics/epic-details-modal'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Label {
  id: string
  name: string
  color: string
}

interface TaskDetailsModalProps {
  task: {
    id: string
    title: string
    description: string
    status: string
    priority: string
    assignee: {
      name: string
      avatar: string
    } | null
    estimation: number
    epic?: {
      id: string
      title: string
      status: string
    } | null
    labels: Array<{
      id: string
      name: string
      color: string
    }>
  }
  onClose: () => void
  onUpdate?: (updatedTask: any) => void
}

const priorityColors = {
  LOW: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
  URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
}

const statusOptions = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'Todo' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DONE', label: 'Done' },
]

export function TaskDetailsModal({ task, onClose, onUpdate }: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEpicDetails, setShowEpicDetails] = useState(false)
  
  // Form state
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [estimation, setEstimation] = useState(task.estimation.toString())
  const [assigneeId, setAssigneeId] = useState('')
  
  // Data for dropdowns
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [availableLabels, setAvailableLabels] = useState<Label[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels.map(l => l.id))

  useEffect(() => {
    if (isEditing) {
      fetchTeamData()
    }
  }, [isEditing])

  const fetchTeamData = async () => {
    try {
      // Get task details to find team ID
      const taskResponse = await fetch(`/api/tasks/${task.id}`)
      const taskData = await taskResponse.json()
      
      if (taskData.team?.id) {
        // Fetch team members
        const membersResponse = await fetch(`/api/teams/${taskData.team.id}/members`)
        const membersData = await membersResponse.json()
        setTeamMembers(membersData || [])
        
        // Set current assignee if exists
        if (taskData.assignee) {
          setAssigneeId(taskData.assignee.id)
        }
      }

      // Fetch available labels
      const labelsResponse = await fetch('/api/labels')
      const labelsData = await labelsResponse.json()
      setAvailableLabels(labelsData || [])
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updateData = {
        title,
        description,
        status,
        priority,
        estimation: parseInt(estimation) || 0,
        assigneeId: assigneeId || null,
      }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to update task')
      }

      const updatedTask = await response.json()

      // Update labels if changed
      if (JSON.stringify(selectedLabels.sort()) !== JSON.stringify(task.labels.map(l => l.id).sort())) {
        await updateTaskLabels()
      }

      setIsEditing(false)
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updatedTask)
      }
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to update task:', error)
      const message = error instanceof Error ? error.message : 'Failed to update task. Please try again.'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskLabels = async () => {
    try {
      // Remove current labels
      await fetch(`/api/tasks/${task.id}/labels`, {
        method: 'DELETE',
      })

      // Add new labels
      if (selectedLabels.length > 0) {
        await fetch(`/api/tasks/${task.id}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ labelIds: selectedLabels }),
        })
      }
    } catch (error) {
      console.error('Failed to update labels:', error)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h3>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Edit task"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete task"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="Enter task title"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                {task.title}
              </h2>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="Enter task description"
              />
            ) : (
              <p className="text-gray-600 dark:text-zinc-400 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                  {statusOptions.find(s => s.value === task.status)?.label || task.status}
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {task.priority}
                </span>
              )}
            </div>
          </div>

          {/* Epic */}
          {task.epic && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Epic
              </label>
              <button
                onClick={() => setShowEpicDetails(true)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-md border border-gray-200 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer group"
              >
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {task.epic.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    Status: {task.epic.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          )}

          {/* Assignee and Estimation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Assignee
              </label>
              {isEditing ? (
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              ) : (
                task.assignee ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-zinc-600"
                    />
                    <span className="text-gray-900 dark:text-zinc-100">{task.assignee.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
                    <User className="h-5 w-5" />
                    <span>Unassigned</span>
                  </div>
                )
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Estimation (hours)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={estimation}
                  onChange={(e) => setEstimation(e.target.value)}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="0"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
                  <Clock className="h-5 w-5" />
                  <span>{task.estimation}h</span>
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Labels
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity ${
                        selectedLabels.includes(label.id) ? 'opacity-100' : 'opacity-50'
                      }`}
                      style={{ backgroundColor: label.color }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      {label.name}
                      {selectedLabels.includes(label.id) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {availableLabels.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">No labels available</p>
                )}
              </div>
            ) : (
              task.labels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      {label.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-zinc-400">No labels assigned</p>
              )
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-600">
              <button
                onClick={() => {
                  setIsEditing(false)
                  // Reset form to original values
                  setTitle(task.title)
                  setDescription(task.description)
                  setStatus(task.status)
                  setPriority(task.priority)
                  setEstimation(task.estimation.toString())
                  setSelectedLabels(task.labels.map(l => l.id))
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 inline" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Epic Details Modal */}
      {showEpicDetails && task.epic && (
        <EpicDetailsModal
          epicId={task.epic.id}
          onClose={() => setShowEpicDetails(false)}
          onUpdate={() => {}} // Epic updates don't need to refresh task
          onDelete={() => {}} // Epic deletion handling
          onRefresh={() => {}} // Epic refresh handling
        />
      )}
    </div>
  )
}