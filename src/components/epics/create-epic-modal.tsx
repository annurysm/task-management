'use client'

import { useState } from 'react'
import { X, Calendar } from 'lucide-react'

interface Team {
  id: string
  name: string
  organization: {
    id: string
    name: string
  }
}

interface CreateEpicModalProps {
  teams: Team[]
  onClose: () => void
  onSubmit: (epicData: {
    title: string
    description: string
    teamId: string
    status: string
    dueDate?: string
  }) => Promise<void>
}

export function CreateEpicModal({ teams, onClose, onSubmit }: CreateEpicModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [status, setStatus] = useState('PLANNING')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !teamId) return

    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        teamId,
        status,
        dueDate: dueDate || undefined
      })
    } finally {
      setLoading(false)
    }
  }

  // Group teams by organization
  const teamsByOrg = teams.reduce((acc: { [key: string]: Team[] }, team) => {
    const orgName = team.organization?.name || 'Unknown Organization'
    if (!acc[orgName]) {
      acc[orgName] = []
    }
    acc[orgName].push(team)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Create New Epic</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Epic Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., User Authentication System"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe the epic's goals and scope"
              rows={3}
            />
          </div>

          {/* Team Selection */}
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Assigned Team *
            </label>
            <select
              id="team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Select a team...</option>
              {Object.entries(teamsByOrg).map(([orgName, orgTeams]) => (
                <optgroup key={orgName} label={orgName}>
                  {orgTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Initial Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Due Date (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !teamId || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Epic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}