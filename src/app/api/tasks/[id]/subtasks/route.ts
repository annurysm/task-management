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

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: id },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!task || task.team.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
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
    })

    return NextResponse.json(subtasks)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
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

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: id },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!task || task.team.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      title,
      description,
      assigneeId,
      estimation,
      status = 'TODO',
      labelIds = []
    } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get the highest position for the subtask
    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId: id },
      orderBy: { position: 'desc' }
    })

    const position = (lastSubtask?.position || 0) + 1000

    const subtask = await prisma.subtask.create({
      data: {
        title,
        description,
        taskId: id,
        assigneeId,
        estimation,
        status,
        position,
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
        labels: {
          include: {
            label: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'CREATED',
        entityType: 'SUBTASK',
        entityId: subtask.id,
        userId: session.user.id,
        details: {
          title: subtask.title,
          taskId: id
        }
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}