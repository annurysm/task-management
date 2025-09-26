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
    const organizationId = searchParams.get('organizationId')

    let whereClause: any = {
      organization: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    }

    if (organizationId) {
      whereClause.organizationId = organizationId
    }

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        organization: {
          select: { id: true, name: true }
        },
        tasks: {
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
                }
              }
            },
            epic: {
              select: { id: true, title: true, status: true }
            }
          }
        },
        weeklySyncs: {
          orderBy: { weekStartDate: 'desc' },
          take: 5
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(objectives)
  } catch (error) {
    console.error('Error fetching objectives:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, organizationId } = await request.json()

    if (!title || !organizationId) {
      return NextResponse.json({ 
        error: 'Title and organization ID are required' 
      }, { status: 400 })
    }

    // Verify user has access to the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const objective = await prisma.objective.create({
      data: {
        title,
        description,
        organizationId
      },
      include: {
        organization: {
          select: { id: true, name: true }
        },
        tasks: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(objective, { status: 201 })
  } catch (error) {
    console.error('Error creating objective:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}