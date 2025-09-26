'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { CreateLabelModal } from './create-label-modal'
import { EditLabelModal } from './edit-label-modal'

interface Organization {
  id: string
  name: string
}

interface Label {
  id: string
  name: string
  color: string
  organizationId: string
  _count: {
    tasks: number
    subtasks: number
  }
}

export function LabelManager() {
  const [labels, setLabels] = useState<Label[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchLabels()
    }
  }, [selectedOrgId])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        if (data.length > 0) {
          setSelectedOrgId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLabels = async () => {
    if (!selectedOrgId) return
    
    try {
      const response = await fetch(`/api/labels?organizationId=${selectedOrgId}`)
      if (response.ok) {
        const data = await response.json()
        setLabels(data)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  const handleCreateLabel = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, organizationId: selectedOrgId })
      })
      
      if (response.ok) {
        await fetchLabels()
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating label:', error)
    }
  }

  const handleUpdateLabel = async (id: string, name: string, color: string) => {
    try {
      const response = await fetch(`/api/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      })
      
      if (response.ok) {
        await fetchLabels()
        setEditingLabel(null)
      }
    } catch (error) {
      console.error('Error updating label:', error)
    }
  }

  const handleDeleteLabel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/labels/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchLabels()
      }
    } catch (error) {
      console.error('Error deleting label:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No organizations found</h3>
        <p className="text-gray-600 dark:text-zinc-400 mb-4">
          You need to be part of an organization to manage labels
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Label
        </button>
      </div>

      {/* Labels Grid */}
      {labels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {labels.map((label) => (
            <div key={label.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200 dark:border-zinc-600"
                    style={{ backgroundColor: label.color }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{label.name}</h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingLabel(label)}
                    className="p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="p-1 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-1">
                <div>Tasks: {label._count.tasks}</div>
                <div>Subtasks: {label._count.subtasks}</div>
                <div className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                  Total: {label._count.tasks + label._count.subtasks} items
                </div>
              </div>

              {/* Label Preview */}
              <div className="mt-3">
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No labels yet</h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-4">
            Create your first label to start organizing tasks
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
          >
            Create Label
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateLabelModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLabel}
        />
      )}

      {editingLabel && (
        <EditLabelModal
          label={editingLabel}
          onClose={() => setEditingLabel(null)}
          onSubmit={handleUpdateLabel}
        />
      )}
    </div>
  )
}