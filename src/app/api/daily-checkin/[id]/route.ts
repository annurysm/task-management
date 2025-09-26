import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const checkin = await prisma.dailyCheckin.findUnique({
      where: { id },
      select: { id: true, userId: true }
    })

    if (!checkin) {
      return NextResponse.json({ error: "Daily check-in not found" }, { status: 404 })
    }

    if (checkin.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData = {
      todayGoals: body.todayGoals ?? undefined,
      blockers: body.blockers ?? undefined,
      mood: body.mood ?? undefined,
      energyLevel: typeof body.energyLevel === "number" ? body.energyLevel : undefined,
      notes: body.notes ?? undefined
    }

    const updated = await prisma.dailyCheckin.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        },
        team: {
          select: { id: true, name: true }
        },
        taskUpdates: {
          include: {
            task: { select: { id: true, title: true } }
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating daily check-in:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
