import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { WeeklyPlanningDashboard } from '@/components/weekly-planning/weekly-planning-dashboard'

export default async function WeeklyPlanningPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Weekly Planning</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and track team tasks by week</p>
        </div>
        <WeeklyPlanningDashboard />
      </div>
    </DashboardLayout>
  )
}