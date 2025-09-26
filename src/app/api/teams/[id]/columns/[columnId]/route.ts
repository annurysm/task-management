import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string; columnId: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id, columnId } = await params
    
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

    const { title, color, position } = await request.json()

    const column = await prisma.kanbanColumn.update({
      where: { id: columnId },
      data: {
        ...(title && { title }),
        ...(color && { color }),
        ...(position !== undefined && { position })
      }
    })

    return NextResponse.json(column)
  } catch (error) {
    console.error('Error updating kanban column:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    const { id, columnId } = await params
    
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

    // Check if column exists and get its status
    const column = await prisma.kanbanColumn.findUnique({
      where: { id: columnId }
    })

    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }

    // Check if there are any tasks in this status
    const tasksInColumn = await prisma.task.count({
      where: { 
        teamId: id,
        status: column.status as any
      }
    })

    if (tasksInColumn > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete column with existing tasks. Please move all tasks to other columns first.' 
      }, { status: 400 })
    }

    await prisma.kanbanColumn.delete({
      where: { id: columnId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kanban column:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}