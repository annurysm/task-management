'use client'

import { useState, useEffect } from 'react'
import { Plus, Target } from 'lucide-react'
import { CreateObjectiveModal } from './create-objective-modal'
import { ObjectiveCard } from './objective-card'
import { WeeklyPlanningModal } from './weekly-planning-modal'

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
  weeklySyncs: Array<{
    id: string
    weekStartDate: string
    notes: string | null
    attendees: any
  }>
  _count: {
    tasks: number
  }
}

export function ObjectivesDashboard() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedObjectiveForPlanning, setSelectedObjectiveForPlanning] = useState<string | null>(null)

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

  const handleCreateObjective = async (title: string, description: string) => {
    try {
      const response = await fetch('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, organizationId: selectedOrgId })
      })
      
      if (response.ok) {
        await fetchObjectives()
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating objective:', error)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

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

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Objective
        </button>
      </div>

      {/* Objectives View */}
      <div className="space-y-6">
        {objectives.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                onPlanWeekly={() => setSelectedObjectiveForPlanning(objective.id)}
                onRefresh={fetchObjectives}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No objectives yet</h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-4">
              Create your first objective to start tracking strategic goals
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              Create Objective
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateObjectiveModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateObjective}
        />
      )}

      {selectedObjectiveForPlanning && (
        <WeeklyPlanningModal
          objectiveId={selectedObjectiveForPlanning}
          onClose={() => setSelectedObjectiveForPlanning(null)}
          onRefresh={fetchObjectives}
        />
      )}
    </div>
  )
}