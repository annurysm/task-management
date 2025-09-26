import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStartDate = searchParams.get('weekStartDate')

    let whereClause: any = {
      objectiveId: id
    }

    if (weekStartDate) {
      whereClause.weekStartDate = new Date(weekStartDate)
    }

    const objectiveTasks = await prisma.objectiveTask.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, image: true }
            },
            team: {
              select: { id: true, name: true }
            },
            labels: {
              include: {
                label: true
              }
            },
            _count: {
              select: { subtasks: true }
            }
          }
        },
        epic: {
          select: { id: true, title: true, status: true }
        }
      },
      orderBy: [
        { weekStartDate: 'asc' },
        { weekPriority: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(objectiveTasks)
  } catch (error) {
    console.error('Error fetching objective tasks:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      taskId, 
      epicId, 
      weekStartDate, 
      weekPriority, 
      assignedTeam,
      isCommitted = false 
    } = await request.json()

    if (!taskId && !epicId) {
      return NextResponse.json({ 
        error: 'Either taskId or epicId is required' 
      }, { status: 400 })
    }

    // Verify user has access to the objective
    const objective = await prisma.objective.findUnique({
      where: { id: id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!objective || objective.organization.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if this task/epic is already added to the objective
    const existing = await prisma.objectiveTask.findFirst({
      where: {
        objectiveId: id,
        taskId: taskId || null,
        epicId: epicId || null
      }
    })

    let result
    if (existing) {
      // Update existing entry
      result = await prisma.objectiveTask.update({
        where: {
          id: existing.id
        },
        data: {
          weekStartDate: weekStartDate ? new Date(weekStartDate) : null,
          weekPriority,
          assignedTeam,
          isCommitted
        },
        include: {
          task: {
            include: {
              assignee: { select: { id: true, name: true, email: true, image: true } },
              team: { select: { id: true, name: true } },
              labels: { include: { label: true } }
            }
          },
          epic: { select: { id: true, title: true, status: true } }
        }
      })
    } else {
      // Create new entry
      result = await prisma.objectiveTask.create({
        data: {
          objectiveId: id,
          taskId,
          epicId,
          weekStartDate: weekStartDate ? new Date(weekStartDate) : null,
          weekPriority,
          assignedTeam,
          isCommitted
        },
        include: {
          task: {
            include: {
              assignee: { select: { id: true, name: true, email: true, image: true } },
              team: { select: { id: true, name: true } },
              labels: { include: { label: true } }
            }
          },
          epic: { select: { id: true, title: true, status: true } }
        }
      })
    }

    return NextResponse.json(result, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error adding task to objective:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}