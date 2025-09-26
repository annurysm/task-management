import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const organizationId = searchParams.get('organizationId')

    let whereClause: any = {}

    if (teamId) {
      whereClause.teamId = teamId
    }

    if (organizationId) {
      whereClause.team = {
        organizationId: organizationId
      }
    }

    const epics = await prisma.epic.findMany({
      where: whereClause,
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
            labels: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(epics)
  } catch (error) {
    console.error('Error fetching epics:', error)
    return NextResponse.json({ error: 'Failed to fetch epics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, teamId, status = 'PLANNING', dueDate } = await request.json()

    if (!title || !teamId) {
      return NextResponse.json({ error: 'Title and team are required' }, { status: 400 })
    }

    // Verify user has access to this team
    const userMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId
      }
    })

    if (!userMember) {
      return NextResponse.json({ error: 'Access denied to this team' }, { status: 403 })
    }

    // Get the team to find the organization ID
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { organizationId: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const epic = await prisma.epic.create({
      data: {
        title,
        description,
        organizationId: team.organizationId,
        teamId,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: session.user.id
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
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    // Log activity - temporarily disabled due to foreign key constraint issue
    // await prisma.activityLog.create({
    //   data: {
    //     userId: session.user.id,
    //     action: 'EPIC_CREATED',
    //     entityType: 'EPIC',
    //     entityId: epic.id,
    //     teamId: teamId,
    //     details: {
    //       epicTitle: title,
    //       teamName: epic.team.name
    //     }
    //   }
    // })

    return NextResponse.json(epic, { status: 201 })
  } catch (error) {
    console.error('Error creating epic:', error)
    return NextResponse.json({ error: 'Failed to create epic' }, { status: 500 })
  }
}