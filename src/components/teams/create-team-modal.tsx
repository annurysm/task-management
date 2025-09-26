'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Organization {
  id: string
  name: string
}

interface CreateTeamModalProps {
  onClose: () => void
  onSubmit: (teamData: {
    name: string
    description: string
    organizationId: string
  }) => Promise<void>
}

export function CreateTeamModal({ onClose, onSubmit }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        // Auto-select first organization if available
        if (data.length > 0) {
          setOrganizationId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !organizationId) return

    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        organizationId
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingOrgs) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Organization Selection */}
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Organization *
            </label>
            <select
              id="organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Frontend Team, Marketing, DevOps"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe the team's purpose and responsibilities"
              rows={3}
            />
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
              disabled={!name.trim() || !organizationId || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}