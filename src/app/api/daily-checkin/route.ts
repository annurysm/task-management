import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const body = await request.json()
    const {
      teamId,
      todayGoals,
      blockers,
      mood,
      notes
    } = body
    const energyLevel = body.energyLevel ?? 3
    const yesterdayAccomplishmentsRaw = (body.yesterdayAccomplishments ?? '').toString().trim()
    const yesterdayAccomplishments = yesterdayAccomplishmentsRaw || 'Not provided'

    // Validate required fields
    if (!teamId || !todayGoals || !mood) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

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

    const date = body.date ? new Date(body.date) : new Date()
    date.setHours(0, 0, 0, 0)

    // Check if user already has a check-in for this day and team
    const existingCheckin = await prisma.dailyCheckin.findUnique({
      where: {
        userId_teamId_date: {
          userId,
          teamId: teamId,
          date
        }
      }
    })

    if (existingCheckin) {
      return NextResponse.json({ 
        error: 'Check-in already submitted for this date' 
      }, { status: 409 })
    }

    // Create the daily check-in
    let checkin
    try {
      checkin = await prisma.dailyCheckin.create({
        data: {
          userId,
          teamId: teamId,
          date,
          yesterdayAccomplishments,
          todayGoals,
          blockers,
          mood,
          energyLevel,
          notes
        },
        include: {
          user: {
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
          }
        }
      })
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return NextResponse.json({
          error: 'Check-in already submitted for today'
        }, { status: 409 })
      }
      if (error?.code === 'P2003') {
        return NextResponse.json({
          error: 'Unable to create check-in because the user or team reference is invalid.'
        }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('Error creating daily check-in:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ 
      error: message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')

    // Determine accessible organisations for this user
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId: session.user.id },
      select: { organizationId: true }
    })

    const accessibleOrgIds = orgMemberships.map((m) => m.organizationId)

    if (accessibleOrgIds.length === 0) {
      return NextResponse.json([])
    }

    const where: any = {
      team: {
        organizationId: { in: accessibleOrgIds }
      }
    }

    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { organizationId: true }
      })

      if (!team || !accessibleOrgIds.includes(team.organizationId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      where.teamId = teamId
    }

    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      where.date = targetDate
    }

    if (userId) {
      where.userId = userId
    }

    const checkins = await prisma.dailyCheckin.findMany({
      where,
      include: {
        user: {
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
            name: true,
            organizationId: true
          }
        },
        taskUpdates: {
          include: {
            task: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(checkins)
  } catch (error) {
    console.error('Error fetching daily check-ins:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
