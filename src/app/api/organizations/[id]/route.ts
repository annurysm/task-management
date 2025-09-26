import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if user is an owner or admin of the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: id
        }
      }
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only organization owners and admins can edit organizations' }, { status: 403 })
    }

    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
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

    return NextResponse.json(updatedOrganization)
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the owner of the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: id
        }
      }
    })

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only organization owners can delete organizations' }, { status: 403 })
    }

    // Get organization details for logging
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Log activity BEFORE deleting the organization - temporarily disabled due to foreign key constraint issue
    // await prisma.activityLog.create({
    //   data: {
    //     action: 'DELETED',
    //     entityType: 'ORGANIZATION',
    //     entityId: organization.id,
    //     userId: session.user.id,
    //     details: { name: organization.name }
    //   }
    // })

    // Delete the organization (this will cascade delete members, teams, etc.)
    await prisma.organization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}