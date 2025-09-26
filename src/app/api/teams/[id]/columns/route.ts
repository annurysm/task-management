import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id } = await params
    
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

    const columns = await prisma.kanbanColumn.findMany({
      where: { teamId: id },
      orderBy: { position: 'asc' }
    })

    // If no columns exist, create default ones
    if (columns.length === 0) {
      const defaultColumns = [
        { title: 'Backlog', status: 'BACKLOG', color: 'bg-gray-100', position: 1000 },
        { title: 'Todo', status: 'TODO', color: 'bg-blue-100', position: 2000 },
        { title: 'In Progress', status: 'IN_PROGRESS', color: 'bg-yellow-100', position: 3000 },
        { title: 'In Review', status: 'IN_REVIEW', color: 'bg-purple-100', position: 4000 },
        { title: 'On Hold', status: 'ON_HOLD', color: 'bg-orange-100', position: 5000 },
        { title: 'Done', status: 'DONE', color: 'bg-green-100', position: 6000 },
      ]

      const createdColumns = await Promise.all(
        defaultColumns.map(column =>
          prisma.kanbanColumn.create({
            data: {
              ...column,
              teamId: id
            }
          })
        )
      )

      return NextResponse.json(createdColumns)
    }

    return NextResponse.json(columns)
  } catch (error) {
    console.error('Error fetching kanban columns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id } = await params
    
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

    const { title, status, color } = await request.json()

    if (!title || !status || !color) {
      return NextResponse.json({ error: 'Title, status, and color are required' }, { status: 400 })
    }

    // Get the highest position
    const lastColumn = await prisma.kanbanColumn.findFirst({
      where: { teamId: id },
      orderBy: { position: 'desc' }
    })

    const position = (lastColumn?.position || 0) + 1000

    const column = await prisma.kanbanColumn.create({
      data: {
        title,
        status,
        color,
        position,
        teamId: id
      }
    })

    return NextResponse.json(column, { status: 201 })
  } catch (error) {
    console.error('Error creating kanban column:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}