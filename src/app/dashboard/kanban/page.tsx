import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { MasterKanbanView } from '@/components/kanban/master-kanban-view'

export default async function AllTasksPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage tasks from all your teams</p>
        </div>
        <MasterKanbanView />
      </div>
    </DashboardLayout>
  )
}