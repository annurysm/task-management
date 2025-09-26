import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emitTaskUpdate } from '@/lib/socket-emit'

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

    const task = await prisma.task.findUnique({
      where: { id: id },
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
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    const task = await prisma.task.findUnique({
      where: { id: id },
      include: {
        team: { select: { id: true, organizationId: true } }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: { status }
    })

    // Emit real-time update
    emitTaskUpdate(task.teamId, task.team.organizationId, {
      id: updatedTask.id,
      status: updatedTask.status,
      updatedBy: session.user.name || session.user.email || 'Unknown'
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: id },
      select: { id: true, teamId: true, status: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      estimation,
      epicId,
      position
    } = await request.json()

    // Handle position update for status change
    let updateData: any = {
      title,
      description,
      priority,
      assigneeId,
      estimation,
      epicId
    }

    if (status && status !== task.status) {
      // If status is changing, calculate new position
      const lastTaskInNewStatus = await prisma.task.findFirst({
        where: { teamId: task.teamId, status },
        orderBy: { position: 'desc' }
      })
      
      updateData.status = status
      updateData.position = (lastTaskInNewStatus?.position || 0) + 1000
    } else if (position !== undefined) {
      updateData.position = position
    }

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: updateData,
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
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    })

    // Log activity
    let activityAction = 'UPDATED'
    let activityMetadata: any = { title: updatedTask.title }

    if (status && status !== task.status) {
      activityAction = 'STATUS_CHANGED'
      activityMetadata.fromStatus = task.status
      activityMetadata.toStatus = status
    }

    if (assigneeId) {
      activityAction = 'ASSIGNED'
      activityMetadata.assigneeId = assigneeId
    }

    try {
      await prisma.activityLog.create({
        data: {
          action: activityAction as any,
          entityType: 'TASK',
          entityId: updatedTask.id,
          userId: session.user.id,
          teamId: updatedTask.teamId,
          details: activityMetadata
        }
      })
    } catch (logError) {
      console.error('Failed to log task activity:', logError)
    }

    // Get team's organization ID for real-time updates
    const team = await prisma.team.findUnique({
      where: { id: updatedTask.teamId },
      select: { organizationId: true }
    })

    if (team) {
      // Emit real-time update
      emitTaskUpdate(updatedTask.teamId, team.organizationId, {
        id: updatedTask.id,
        status: updatedTask.status,
        updatedBy: session.user.name || session.user.email || 'Unknown'
      })
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: id },
      select: { id: true, teamId: true, title: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: id }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'DELETED',
          entityType: 'TASK',
          entityId: task.id,
          userId: session.user.id,
          teamId: task.teamId,
          details: { title: task.title }
        }
      })
    } catch (logError) {
      console.error('Failed to log task deletion:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
