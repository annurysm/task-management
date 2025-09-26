import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { OrganizationManager } from '@/components/organization/organization-manager'

export default async function OrganizationPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organization Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your organizations and teams</p>
        </div>
        <OrganizationManager />
      </div>
    </DashboardLayout>
  )
}