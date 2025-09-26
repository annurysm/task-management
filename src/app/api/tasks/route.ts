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
    const teamIds = searchParams.getAll('teamId')
    const singleTeamId = searchParams.get('teamId')

    const whereClause: any = {
      team: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    }

    if (teamIds.length > 1) {
      whereClause.teamId = { in: teamIds }
    } else if (singleTeamId) {
      whereClause.teamId = singleTeamId
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true }
        },
        epic: {
          select: { id: true, title: true, status: true }
        },
        team: {
          select: { id: true, name: true }
        },
        labels: {
          include: {
            label: true
          }
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, image: true }
            },
            labels: {
              include: {
                label: true
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { subtasks: true }
        }
      },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      title, 
      description, 
      teamId, 
      epicId, 
      assigneeId, 
      priority, 
      estimation,
      status = 'BACKLOG',
      labelIds = []
    } = await request.json()

    if (!title || !teamId) {
      return NextResponse.json({ 
        error: 'Title and team ID are required' 
      }, { status: 400 })
    }

    // Verify user is member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the highest position for the status column
    const lastTask = await prisma.task.findFirst({
      where: { teamId, status },
      orderBy: { position: 'desc' }
    })

    const position = (lastTask?.position || 0) + 1000

    const task = await prisma.task.create({
      data: {
        title,
        description,
        teamId,
        epicId,
        assigneeId,
        priority: priority || 'MEDIUM',
        estimation,
        status,
        position,
        createdById: session.user.id,
        labels: {
          create: labelIds.map((labelId: string) => ({
            labelId
          }))
        }
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true }
        },
        epic: {
          select: { id: true, title: true, status: true }
        },
        team: {
          select: { id: true, name: true }
        },
        labels: {
          include: {
            label: true
          }
        },
        subtasks: true
      }
    })

    // Log activity (best effort)
    try {
      await prisma.activityLog.create({
        data: {
          action: 'CREATED',
          entityType: 'TASK',
          entityId: task.id,
          userId: session.user.id,
          teamId,
          details: {
            title: task.title,
            teamId,
            status: task.status
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log task creation activity:', logError)
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
