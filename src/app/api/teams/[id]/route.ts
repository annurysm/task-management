import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // First, get the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user has permission to update the team
    const memberInTeam = team.members.find(m => m.userId === session.user.id)
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: team.organizationId
        }
      }
    })

    const canUpdate = (
      (memberInTeam && memberInTeam.role === 'LEAD') ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role))
    )

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to update this team' }, { status: 403 })
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
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

    // First, get the team to check permissions and get organization info
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        organization: true,
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user has permission to delete the team
    // User must be a team lead or organization owner/admin
    const memberInTeam = team.members.find(m => m.userId === session.user.id)
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: team.organizationId
        }
      }
    })

    const canDelete = (
      (memberInTeam && memberInTeam.role === 'LEAD') ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role))
    )

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this team' }, { status: 403 })
    }

    // Log activity before deleting - temporarily disabled due to foreign key constraint issue
    // await prisma.activityLog.create({
    //   data: {
    //     action: 'DELETED',
    //     entityType: 'TEAM',
    //     entityId: team.id,
    //     userId: session.user.id,
    //     details: { name: team.name, organizationId: team.organizationId }
    //   }
    // })

    // Delete the team (this will cascade delete related data like tasks, members, etc.)
    await prisma.team.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}