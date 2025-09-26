import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { KanbanBoard } from '@/components/kanban/kanban-board'

interface PageProps {
  params: { id: string }
}

export default async function TeamKanbanPage({ params }: PageProps) {
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
      organization: true
    }
  })

  if (!team) {
    redirect('/dashboard/teams')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{team.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{team.organization.name} • Kanban Board</p>
        </div>
        <KanbanBoard teamId={params.id} />
      </div>
    </DashboardLayout>
  )
}