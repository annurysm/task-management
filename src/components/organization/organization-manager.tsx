'use client'

import { useState, useEffect } from 'react'
import { Plus, Building, Users, Target, MoreHorizontal, Trash2 } from 'lucide-react'
import { CreateOrganizationModal } from './create-organization-modal'
import { CreateTeamModal } from './create-team-modal'

interface Organization {
  id: string
  name: string
  description: string | null
  teams: { id: string; name: string }[]
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
  _count: {
    teams: number
    epics: number
  }
}

export function OrganizationManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      
      if (response.ok) {
        await fetchOrganizations()
        setShowCreateOrg(false)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
    }
  }

  const handleCreateTeam = async (organizationId: string, name: string, description: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      
      if (response.ok) {
        await fetchOrganizations()
        setShowCreateTeam(null)
      }
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const handleDeleteOrganization = async (organizationId: string, organizationName: string) => {
    if (!confirm(`Are you sure you want to delete "${organizationName}"? This action cannot be undone and will delete all teams and data associated with this organization.`)) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchOrganizations()
        setDropdownOpen(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete organization')
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('Failed to delete organization')
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Organizations</h2>
          <p className="text-gray-600">Manage organizations and their teams</p>
        </div>
        <button
          onClick={() => setShowCreateOrg(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Organizations List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Building className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{org.name}</h3>
                  {org.description && (
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{org.description}</p>
                  )}
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(dropdownOpen === org.id ? null : org.id)}
                  className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {dropdownOpen === org.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-zinc-600 py-1 z-20">
                      <button
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Organization
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{org.members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{org._count.epics} epics</span>
              </div>
            </div>

            {/* Teams */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-zinc-100">
                  Teams ({org._count.teams})
                </h4>
                <button
                  onClick={() => setShowCreateTeam(org.id)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Team
                </button>
              </div>
              
              {org.teams.length > 0 ? (
                <div className="space-y-2">
                  {org.teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{team.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-zinc-400 italic">No teams yet</p>
              )}
            </div>

            {/* Members */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 dark:text-zinc-100 mb-3">Members</h4>
              <div className="flex -space-x-2">
                {org.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="relative">
                    <img
                      src={
                        member.user.image?.startsWith('https://lh3.googleusercontent.com/')
                          ? `/api/proxy/image?url=${encodeURIComponent(member.user.image)}`
                          : member.user.image || '/default-avatar.svg'
                      }
                      alt={member.user.name || member.user.email}
                      className="h-8 w-8 rounded-full border-2 border-white"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.svg'
                      }}
                    />
                  </div>
                ))}
                {org.members.length > 5 && (
                  <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300">
                    +{org.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No organizations yet</h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-4">Create your first organization to get started</p>
          <button
            onClick={() => setShowCreateOrg(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
          >
            Create Organization
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateOrg && (
        <CreateOrganizationModal
          onClose={() => setShowCreateOrg(false)}
          onSubmit={handleCreateOrganization}
        />
      )}
      
      {showCreateTeam && (
        <CreateTeamModal
          organizationId={showCreateTeam}
          onClose={() => setShowCreateTeam(null)}
          onSubmit={handleCreateTeam}
        />
      )}
    </div>
  )
}