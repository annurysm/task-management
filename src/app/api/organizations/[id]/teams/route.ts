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

    // Verify user is member of the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: id
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teams = await prisma.team.findMany({
      where: {
        organizationId: id
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        _count: {
          select: { tasks: true, epics: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
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

    // Verify user has admin privileges in organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: id
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        organizationId: id,
        members: {
          create: {
            userId: session.user.id,
            role: 'LEAD'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        _count: {
          select: { tasks: true, epics: true }
        }
      }
    })

    // Log activity - temporarily disabled due to foreign key constraint issue
    // await prisma.activityLog.create({
    //   data: {
    //     action: 'CREATED',
    //     entityType: 'TEAM',
    //     entityId: team.id,
    //     userId: session.user.id,
    //     details: { name: team.name, organizationId: id }
    //   }
    // })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}