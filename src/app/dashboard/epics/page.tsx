import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EpicsDashboard } from '@/components/epics/epics-dashboard'

export default async function EpicsPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Epic Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage strategic initiatives and track progress across teams
          </p>
        </div>
        <EpicsDashboard />
      </div>
    </DashboardLayout>
  )
}