import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        organization: {
          select: { id: true, name: true }
        },
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, organizationId } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization is required' }, { status: 400 })
    }

    // Check if user is a member of the organization and has permission to create teams
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organizationId
        }
      }
    })

    if (!orgMembership || !['OWNER', 'ADMIN'].includes(orgMembership.role)) {
      return NextResponse.json({ error: 'Only organization owners and admins can create teams' }, { status: 403 })
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: organizationId,
        members: {
          create: {
            userId: session.user.id,
            role: 'LEAD' // Creator becomes team lead
          }
        }
      },
      include: {
        organization: {
          select: { id: true, name: true }
        },
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

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}