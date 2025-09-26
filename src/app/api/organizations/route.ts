import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
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
        teams: {
          select: { id: true, name: true }
        },
        _count: {
          select: { teams: true, epics: true }
        }
      }
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
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
        teams: true
      }
    })

    // Log activity - temporarily disabled due to foreign key constraint issue
    // await prisma.activityLog.create({
    //   data: {
    //     action: 'CREATED',
    //     entityType: 'ORGANIZATION',
    //     entityId: organization.id,
    //     userId: session.user.id,
    //     details: { name: organization.name }
    //   }
    // })

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}