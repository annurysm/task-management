import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {session.user?.name}</p>
        </div>
        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  )
}