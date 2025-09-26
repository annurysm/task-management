import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TeamManager } from '@/components/teams/team-manager'

export default async function TeamsPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your teams and their kanban boards</p>
        </div>
        <TeamManager />
      </div>
    </DashboardLayout>
  )
}