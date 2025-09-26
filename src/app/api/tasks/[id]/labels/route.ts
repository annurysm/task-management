import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { labelIds } = await request.json()

    const task = await prisma.task.findUnique({
      where: { id: id },
      select: { id: true, teamId: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add labels to task
    const labelConnections = labelIds.map((labelId: string) => ({
      taskId: id,
      labelId: labelId
    }))

    await prisma.taskLabel.createMany({
      data: labelConnections,
      skipDuplicates: true
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding labels to task:', error)
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

    const task = await prisma.task.findUnique({
      where: { id: id },
      select: { id: true, teamId: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify user has access to this task
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove all labels from task
    await prisma.taskLabel.deleteMany({
      where: { taskId: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing labels from task:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}