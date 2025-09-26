import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { BarChart3, TrendingUp, Users, Clock, Target } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function TeamAnalyticsPage({ params }: PageProps) {
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
      },
      tasks: {
        include: {
          assignee: true
        }
      }
    }
  })

  if (!team) {
    redirect('/dashboard/teams')
  }

  // Calculate some basic stats
  const totalTasks = team.tasks.length
  const completedTasks = team.tasks.filter(task => task.status === 'DONE').length
  const inProgressTasks = team.tasks.filter(task => task.status === 'IN_PROGRESS').length
  const todoTasks = team.tasks.filter(task => task.status === 'TODO').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{team.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{team.organization.name} • Analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{totalTasks}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{completedTasks}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{inProgressTasks}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Team Members Performance */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </h3>
          <div className="space-y-4">
            {team.members.map((member) => {
              const memberTasks = team.tasks.filter(task => task.assigneeId === member.userId)
              const memberCompleted = memberTasks.filter(task => task.status === 'DONE').length
              const memberCompletionRate = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0

              return (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        member.user.image?.startsWith('https://lh3.googleusercontent.com/')
                          ? `/api/proxy/image?url=${encodeURIComponent(member.user.image)}`
                          : member.user.image || '/default-avatar.svg'
                      }
                      alt={member.user.name || member.user.email}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{memberCompleted}/{memberTasks.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{memberCompletionRate}% complete</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Status Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">To Do</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{todoTasks}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full" 
                style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{inProgressTasks}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{completedTasks}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}