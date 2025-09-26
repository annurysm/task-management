import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Base where clause for user's accessible tasks
    const whereClause = {
      team: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      createdAt: {
        gte: startDate
      }
    }

    // Fetch all tasks in the period
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        team: {
          select: { name: true }
        }
      }
    })

    // Calculate basic metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'DONE').length
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
    const overdueTasksCount = 0 // Would need due dates to calculate properly

    // Status distribution
    const statusCounts: { [key: string]: number } = {}
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
    })

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    }))

    // Priority distribution
    const priorityCounts: { [key: string]: number } = {}
    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1
    })

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    }))

    // Team stats
    const teamCounts: { [key: string]: { total: number, completed: number } } = {}
    tasks.forEach(task => {
      const teamName = task.team.name
      if (!teamCounts[teamName]) {
        teamCounts[teamName] = { total: 0, completed: 0 }
      }
      teamCounts[teamName].total++
      if (task.status === 'DONE') {
        teamCounts[teamName].completed++
      }
    })

    const teamStats = Object.entries(teamCounts).map(([teamName, stats]) => ({
      teamName,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))

    // Velocity data (weekly breakdown)
    const velocityData = []
    const weeks = Math.ceil(period / 7)
    
    for (let i = 0; i < Math.min(weeks, 8); i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekTasks = tasks.filter(task => 
        task.createdAt >= weekStart && task.createdAt < weekEnd
      )
      
      const completedInWeek = tasks.filter(task => 
        task.updatedAt >= weekStart && task.updatedAt < weekEnd && task.status === 'DONE'
      ).length

      velocityData.unshift({
        week: `Week ${weeks - i}`,
        completed: completedInWeek,
        created: weekTasks.length
      })
    }

    const analyticsData = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasksCount,
      averageCompletionTime: 0, // Would need completion timestamps to calculate
      teamStats,
      statusDistribution,
      priorityDistribution,
      velocityData: velocityData.slice(-6) // Show last 6 weeks
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}