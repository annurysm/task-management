import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DailyCheckinClient } from '@/components/daily-checkin/daily-checkin-client'

export default async function DailyCheckinPage() {
  const session = await auth()

  if (!session) {
    redirect('/')
  }

  return (
    <DashboardLayout>
      <DailyCheckinClient />
    </DashboardLayout>
  )
}