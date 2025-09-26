import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LabelManager } from '@/components/labels/label-manager'

export default async function LabelsPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Labels</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage labels for categorizing and filtering tasks</p>
        </div>
        <LabelManager />
      </div>
    </DashboardLayout>
  )
}