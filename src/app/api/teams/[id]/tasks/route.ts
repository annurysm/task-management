import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const teamId = params.id

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ 
        error: 'User is not a member of this team' 
      }, { status: 403 })
    }

    // Get tasks for the team that are assigned to the current user or are active
    const tasks = await prisma.task.findMany({
      where: {
        teamId: teamId,
        OR: [
          { assigneeId: userId },
          { 
            status: {
              in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW']
            }
          }
        ]
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        epic: {
          select: {
            id: true,
            title: true
          }
        },
        labels: {
          include: {
            label: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching team tasks:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
