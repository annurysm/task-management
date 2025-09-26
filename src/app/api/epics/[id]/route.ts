import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const epic = await prisma.epic.findUnique({
      where: {
        id: id
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            labels: true,
            subtasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (!epic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 })
    }

    // Verify user has access to this epic's team
    const userMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: epic.teamId
      }
    })

    if (!userMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(epic)
  } catch (error) {
    console.error('Error fetching epic:', error)
    return NextResponse.json({ error: 'Failed to fetch epic' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, status, dueDate, teamId } = await request.json()

    // Get existing epic to verify access
    const existingEpic = await prisma.epic.findUnique({
      where: { id: id },
      include: { team: true }
    })

    if (!existingEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 })
    }

    // Verify user has access to this team
    const userMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: existingEpic.teamId
      }
    })

    if (!userMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let targetTeamId = existingEpic.teamId

    if (teamId && teamId !== existingEpic.teamId) {
      const destinationTeam = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, organizationId: true }
      })

      if (!destinationTeam) {
        return NextResponse.json({ error: 'Target team not found' }, { status: 404 })
      }

      const destinationMembership = await prisma.teamMember.findFirst({
        where: {
          userId: session.user.id,
          teamId
        }
      })

      if (!destinationMembership) {
        return NextResponse.json({ error: 'Access denied for target team' }, { status: 403 })
      }

      if (destinationTeam.organizationId !== existingEpic.team.organizationId) {
        return NextResponse.json({ error: 'Epics can only be moved within the same organization' }, { status: 400 })
      }

      targetTeamId = teamId
    }

    const updateData: Record<string, any> = {
      title,
      description,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      updatedAt: new Date()
    }

    if (targetTeamId !== existingEpic.teamId) {
      updateData.teamId = targetTeamId
    }

    const updatedEpic = await prisma.epic.update({
      where: {
        id: id
      },
      data: updateData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (updateData.teamId) {
      await prisma.task.updateMany({
        where: { epicId: id },
        data: { teamId: updateData.teamId }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'EPIC_UPDATED',
        entityType: 'EPIC',
        entityId: id,
        teamId: existingEpic.teamId,
        details: {
          epicTitle: title,
          changes: { title, description, status, dueDate, teamId: updateData.teamId }
        }
      }
    })

    return NextResponse.json(updatedEpic)
  } catch (error) {
    console.error('Error updating epic:', error)
    return NextResponse.json({ error: 'Failed to update epic' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing epic to verify access
    const existingEpic = await prisma.epic.findUnique({
      where: { id: id },
      include: { 
        team: true,
        _count: { select: { tasks: true } }
      }
    })

    if (!existingEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 })
    }

    // Check if epic has tasks
    if (existingEpic._count.tasks > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete epic with existing tasks. Please reassign or delete tasks first.' 
      }, { status: 400 })
    }

    // Verify user has access to this team
    const userMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: existingEpic.teamId
      }
    })

    if (!userMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.epic.delete({
      where: {
        id: id
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'EPIC_DELETED',
        entityType: 'EPIC',
        entityId: id,
        teamId: existingEpic.teamId,
        details: {
          epicTitle: existingEpic.title,
          teamName: existingEpic.team.name
        }
      }
    })

    return NextResponse.json({ message: 'Epic deleted successfully' })
  } catch (error) {
    console.error('Error deleting epic:', error)
    return NextResponse.json({ error: 'Failed to delete epic' }, { status: 500 })
  }
}
