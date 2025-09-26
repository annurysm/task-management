import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Settings, Users, Shield, Bell, Archive, Trash2 } from 'lucide-react'
import { DeleteTeamButton } from '@/components/teams/delete-team-button'
import { TeamSettingsForm } from '@/components/teams/team-settings-form'
import { InviteMemberButton } from '@/components/teams/invite-member-button'
import { RemoveMemberButton } from '@/components/teams/remove-member-button'

interface PageProps {
  params: { id: string }
}

export default async function TeamSettingsPage({ params }: PageProps) {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  // Verify user has access to this team
  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      members: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      organization: true,
      members: {
        include: {
          user: true
        }
      }
    }
  })

  if (!team) {
    redirect('/dashboard/teams')
  }

  // Check if current user is team lead or org admin
  const currentUserMember = team.members.find(member => member.userId === session.user.id)
  const orgMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: team.organizationId
      }
    }
  })
  const isAdmin = currentUserMember?.role === 'LEAD' || (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{team.name}</h1>
          <p className="text-gray-600 dark:text-zinc-400">{team.organization.name} • Settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Settings</h3>
              <nav className="space-y-2">
                <a href="#general" className="block px-3 py-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 rounded-md">
                  <Settings className="h-4 w-4 inline-block mr-2" />
                  General
                </a>
                <a href="#members" className="block px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
                  <Users className="h-4 w-4 inline-block mr-2" />
                  Members
                </a>
                <a href="#permissions" className="block px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
                  <Shield className="h-4 w-4 inline-block mr-2" />
                  Permissions
                </a>
                <a href="#notifications" className="block px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
                  <Bell className="h-4 w-4 inline-block mr-2" />
                  Notifications
                </a>
                {isAdmin && (
                  <a href="#danger" className="block px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                    <Trash2 className="h-4 w-4 inline-block mr-2" />
                    Delete Team
                  </a>
                )}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <div id="general" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">General Settings</h3>
              <TeamSettingsForm 
                teamId={params.id}
                initialName={team.name}
                initialDescription={team.description}
                isAdmin={isAdmin}
              />
            </div>

            {/* Team Members */}
            <div id="members" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Team Members</h3>
                {isAdmin && (
                  <InviteMemberButton teamId={params.id} />
                )}
              </div>
              <div className="space-y-4">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.user.image?.startsWith('https://lh3.googleusercontent.com/')
                            ? `/api/proxy/image?url=${encodeURIComponent(member.user.image)}`
                            : member.user.image || '/default-avatar.svg'
                        }
                        alt={member.user.name || member.user.email}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-zinc-100">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'LEAD' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                          : 'bg-gray-100 dark:bg-zinc-800/60 text-gray-800 dark:text-zinc-300'
                      }`}>
                        {member.role}
                      </span>
                      {isAdmin && member.userId !== session.user.id && (
                        <RemoveMemberButton
                          teamId={params.id}
                          memberId={member.id}
                          memberName={member.user.name || member.user.email}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div id="permissions" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Permissions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Create Tasks</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Allow members to create new tasks</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled={!isAdmin}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Delete Tasks</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Allow members to delete tasks</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Manage Columns</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Allow members to add/remove columns</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded disabled:opacity-50"
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end mt-4">
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Update Permissions
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div id="notifications" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Task Assignments</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Get notified when you're assigned to a task</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Task Updates</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Get notified when tasks are updated</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-zinc-100">Team Updates</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Get notified about team announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-zinc-600 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            {isAdmin && (
              <div id="danger" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Delete Team</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900 dark:text-red-300">Delete Team</h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          Permanently delete this team and all its data. This action cannot be undone.
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                          This will delete all tasks, epics, and member associations in this team.
                        </p>
                      </div>
                      <DeleteTeamButton teamId={params.id} teamName={team.name} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
