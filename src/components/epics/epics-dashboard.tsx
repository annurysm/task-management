'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Users, Filter, Search } from 'lucide-react'
import { CreateEpicModal } from './create-epic-modal'
import { EpicCard } from './epic-card'
import { EpicDetailsModal } from './epic-details-modal'

interface Organization {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  organization: {
    id: string
    name: string
  }
}

interface Epic {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  teamId: string
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
    status: string
    assignee: {
      id: string
      name: string | null
      email: string
    } | null
  }>
  _count: {
    tasks: number
  }
}

export function EpicsDashboard() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null)
  
  // Filters
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations])

  useEffect(() => {
    if (selectedOrgId || selectedTeamId) {
      fetchEpics()
    }
  }, [selectedOrgId, selectedTeamId])

  const fetchData = async () => {
    try {
      const [orgsResponse, teamsResponse] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/teams')
      ])

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData)
      }

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchEpics = async () => {
    try {
      let url = '/api/epics'
      const params = new URLSearchParams()
      
      if (selectedTeamId) {
        params.append('teamId', selectedTeamId)
      } else if (selectedOrgId) {
        params.append('organizationId', selectedOrgId)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEpics(data)
      }
    } catch (error) {
      console.error('Error fetching epics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEpic = async (epicData: {
    title: string
    description: string
    teamId: string
    status: string
    dueDate?: string
  }) => {
    try {
      const response = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(epicData)
      })

      if (response.ok) {
        await fetchEpics()
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating epic:', error)
    }
  }

  const handleUpdateEpic = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/epics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to update epic')
      }

      await fetchEpics()
    } catch (error) {
      console.error('Error updating epic:', error)
      throw error
    }
  }

  const handleDeleteEpic = async (id: string) => {
    try {
      const response = await fetch(`/api/epics/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to delete epic')
      }

      setEpics(prev => prev.filter(epic => epic.id !== id))
      await fetchEpics()
    } catch (error) {
      console.error('Error deleting epic:', error)
      throw error
    }
  }

  // Filter epics based on search and status
  const filteredEpics = epics.filter(epic => {
    const matchesSearch = !searchTerm || 
      epic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      epic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      epic.team.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !selectedStatus || epic.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Filter teams based on selected organization
  const filteredTeams = teams.filter(team => 
    !selectedOrgId || team.organization.id === selectedOrgId
  )

  const epicStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
  const statusColors: { [key: string]: string } = {
    PLANNING: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    ON_HOLD: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500'
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
        <div className="flex items-center gap-4">
          {/* Organization Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="organization" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Organization:
            </label>
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value)
                setSelectedTeamId('') // Reset team selection
              }}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="team" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Team:
            </label>
            <select
              id="team"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Teams</option>
              {filteredTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {epicStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
          New Epic
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Search epics by title, description, or team..."
        />
      </div>

      {/* Epic Stats */}
      {filteredEpics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {epicStatuses.map((status) => {
            const count = filteredEpics.filter(epic => epic.status === status).length
            return (
              <div key={status} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 text-center">
                <div className={`w-4 h-4 ${statusColors[status]} rounded-full mx-auto mb-2`}></div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">{count}</div>
                <div className="text-xs text-gray-600 dark:text-zinc-400">
                  {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Epic Cards */}
      {filteredEpics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEpics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              onView={() => setSelectedEpicId(epic.id)}
              onUpdate={handleUpdateEpic}
              onDelete={handleDeleteEpic}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No epics found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedStatus ? 
              'Try adjusting your filters or search terms' : 
              'Create your first epic to start organizing your strategic initiatives'
            }
          </p>
          {!searchTerm && !selectedStatus && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              Create Epic
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateEpicModal
          teams={teams}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEpic}
        />
      )}

      {selectedEpicId && (
        <EpicDetailsModal
          epicId={selectedEpicId}
          onClose={() => setSelectedEpicId(null)}
          onUpdate={handleUpdateEpic}
          onDelete={handleDeleteEpic}
          onRefresh={fetchEpics}
        />
      )}
    </div>
  )
}
