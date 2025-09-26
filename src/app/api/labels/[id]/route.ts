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

    const label = await prisma.label.findUnique({
      where: { id: id },
      include: {
        organization: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            tasks: true,
            subtasks: true
          }
        }
      }
    })

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Verify user has access to this label's organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: label.organizationId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(label)
  } catch (error) {
    console.error('Error fetching label:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const label = await prisma.label.findUnique({
      where: { id: id },
      select: { id: true, organizationId: true, name: true }
    })

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Verify user has access to this label's organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: label.organizationId
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, color } = await request.json()

    // Check if new name conflicts with existing labels
    if (name && name !== label.name) {
      const existingLabel = await prisma.label.findUnique({
        where: {
          name_organizationId: {
            name,
            organizationId: label.organizationId
          }
        }
      })

      if (existingLabel) {
        return NextResponse.json({ 
          error: 'Label name already exists in this organization' 
        }, { status: 400 })
      }
    }

    const updatedLabel = await prisma.label.update({
      where: { id: id },
      data: { name, color },
      include: {
        _count: {
          select: {
            tasks: true,
            subtasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedLabel)
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const label = await prisma.label.findUnique({
      where: { id: id },
      select: { id: true, organizationId: true, name: true }
    })

    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Verify user has access to this label's organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: label.organizationId
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.label.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}