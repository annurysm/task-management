'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Epic {
  id: string
  title: string
  status: string
}

interface Label {
  id: string
  name: string
  color: string
}

interface TeamSummary {
  id: string
  members?: Array<{ user: User }>
}

export interface TaskCreatePayload {
  title: string
  description: string
  priority: string
  assigneeId?: string
  epicId?: string
  estimation?: number
  status: string
  labelIds: string[]
}

export interface TaskSubmissionResult {
  success: boolean
  message?: string
}

interface CreateTaskModalProps {
  teamId: string
  initialStatus?: string
  onClose: () => void
  onSubmit: (taskData: TaskCreatePayload) => Promise<TaskSubmissionResult>
}

export function CreateTaskModal({ teamId, initialStatus = 'BACKLOG', onClose, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [assigneeId, setAssigneeId] = useState('')
  const [epicId, setEpicId] = useState('')
  const [estimation, setEstimation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data for dropdowns
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [epics, setEpics] = useState<Epic[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  useEffect(() => {
    fetchTeamData()
  }, [teamId])

  const fetchTeamData = async () => {
    try {
      // Fetch team members, epics, and labels
      const [teamsRes, epicsRes, labelsRes] = await Promise.all([
        fetch(`/api/teams`),
        fetch(`/api/epics?teamId=${teamId}`),
        fetch(`/api/labels?teamId=${teamId}`)
      ])

      if (teamsRes.ok) {
        const teams: TeamSummary[] = await teamsRes.json()
        const currentTeam = teams.find((team) => team.id === teamId)
        if (currentTeam?.members) {
          const members = currentTeam.members.map((member) => member.user)
          setTeamMembers(members)
        }
      }

      if (epicsRes.ok) {
        const epicsData = (await epicsRes.json()) as Epic[]
        setEpics(epicsData)
      }

      if (labelsRes.ok) {
        const labelsData = (await labelsRes.json()) as Label[]
        setLabels(labelsData)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    try {
      const payload: TaskCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId || undefined,
        epicId: epicId || undefined,
        estimation: estimation ? parseFloat(estimation) : undefined,
        status: initialStatus,
        labelIds: selectedLabels
      }

      const result = await onSubmit(payload)

      if (!result?.success) {
        setError(result?.message || 'Failed to create task. Please try again.')
        return
      }

      // Reset form fields for the next creation flow before closing
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setAssigneeId('')
      setEpicId('')
      setEstimation('')
      setSelectedLabels([])
      onClose()
    } catch (submissionError) {
      console.error('Failed to create task:', submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Failed to create task. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Create Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
              placeholder="Describe the task..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimation" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Estimation (hours)
              </label>
              <input
                type="number"
                id="estimation"
                value={estimation}
                onChange={(e) => setEstimation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Assignee
              </label>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email || 'Unknown User'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="epic" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Epic
              </label>
              <select
                id="epic"
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option value="">No Epic</option>
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedLabels.includes(label.id)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) ? label.color : undefined
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
