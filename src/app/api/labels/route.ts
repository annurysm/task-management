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
    const teamId = searchParams.get('teamId')

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
    } else if (teamId) {
      // Get organization ID from team
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { organizationId: true }
      })
      
      if (team) {
        whereClause.organizationId = team.organizationId
      }
    }

    const labels = await prisma.label.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tasks: true,
            subtasks: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, color, organizationId } = await request.json()

    if (!name || !color || !organizationId) {
      return NextResponse.json({ 
        error: 'Name, color, and organization ID are required' 
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

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if label name already exists in organization
    const existingLabel = await prisma.label.findUnique({
      where: {
        name_organizationId: {
          name,
          organizationId
        }
      }
    })

    if (existingLabel) {
      return NextResponse.json({ 
        error: 'Label name already exists in this organization' 
      }, { status: 400 })
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        organizationId
      },
      include: {
        _count: {
          select: {
            tasks: true,
            subtasks: true
          }
        }
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}