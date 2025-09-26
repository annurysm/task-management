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

    // Verify user has access to this team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: id
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    const users = members.map(member => member.user)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching team members:', error)
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

    const { email, role } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!['MEMBER', 'LEAD'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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

    // Check if user has permission to invite members
    const memberInTeam = team.members.find(m => m.userId === session.user.id)
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: team.organizationId
        }
      }
    })

    const canInvite = (
      (memberInTeam && memberInTeam.role === 'LEAD') ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role))
    )

    if (!canInvite) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to invite members to this team' }, { status: 403 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'User with this email does not exist' }, { status: 404 })
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 })
    }

    // Ensure the user belongs to the organisation
    const existingOrgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: team.organizationId
        }
      }
    })

    if (!existingOrgMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: team.organizationId,
          role: 'MEMBER'
        }
      })
    }

    // Add the user to the team
    const newMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId: id,
        role: role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error inviting team member:', error)
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

    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const memberInTeam = team.members.find(m => m.userId === session.user.id)
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: team.organizationId
        }
      }
    })

    const canManageMembers = (
      (memberInTeam && memberInTeam.role === 'LEAD') ||
      (orgMembership && ['OWNER', 'ADMIN'].includes(orgMembership.role))
    )

    if (!canManageMembers) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to manage members' }, { status: 403 })
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!member || member.teamId !== id) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    if (member.role === 'LEAD') {
      const leadCount = await prisma.teamMember.count({
        where: {
          teamId: id,
          role: 'LEAD'
        }
      })

      if (leadCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last team lead' }, { status: 400 })
      }
    }

    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
