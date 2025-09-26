'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Kanban, BarChart3, Settings, Plus } from 'lucide-react'
import { CreateTeamModal } from './create-team-modal'

interface Team {
  id: string
  name: string
  description: string | null
  organization: {
    id: string
    name: string
  }
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
    tasks: number
    epics: number
  }
}

export function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: {
    name: string
    description: string
    organizationId: string
  }) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      if (response.ok) {
        const newTeam = await response.json()
        setTeams(prev => [...prev, newTeam])
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(`Error creating team: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating team:', error)
      alert('Failed to create team')
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
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Your Teams</h2>
          <p className="text-gray-600 dark:text-zinc-400">Manage and access your team workspaces</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg dark:hover:shadow-gray-900/30 transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{team.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{team.organization.name}</p>
                </div>
              </div>
            </div>

            {team.description && (
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">{team.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400 mb-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{team.members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Kanban className="h-4 w-4" />
                <span>{team._count.tasks} tasks</span>
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-4">
              <div className="flex -space-x-2 mb-2">
                {team.members.slice(0, 4).map((member) => (
                  <div key={member.id} className="relative">
                    <img
                      src={
                        member.user.image?.startsWith('https://lh3.googleusercontent.com/')
                          ? `/api/proxy/image?url=${encodeURIComponent(member.user.image)}`
                          : member.user.image || '/default-avatar.svg'
                      }
                      alt={member.user.name || member.user.email}
                      className="h-6 w-6 rounded-full border-2 border-white dark:border-gray-800"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.svg'
                      }}
                    />
                  </div>
                ))}
                {team.members.length > 4 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300">
                    +{team.members.length - 4}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link
                href={`/dashboard/teams/${team.id}/kanban`}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium text-center flex items-center justify-center gap-1"
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Link>
              <Link
                href={`/dashboard/teams/${team.id}/analytics`}
                className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-zinc-300 px-3 py-2 rounded text-sm font-medium flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4" />
              </Link>
              <Link
                href={`/dashboard/teams/${team.id}/settings`}
                className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-zinc-300 px-3 py-2 rounded text-sm font-medium flex items-center justify-center"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No teams yet</h3>
          <p className="text-gray-600 dark:text-zinc-400 mb-4">
            You need to create teams within an organization first
          </p>
          <Link
            href="/dashboard/organization"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
          >
            Manage Organizations
          </Link>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTeam}
        />
      )}
    </div>
  )
}