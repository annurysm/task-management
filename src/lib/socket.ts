import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { auth } from '@/lib/auth'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export interface ServerToClientEvents {
  taskUpdated: (data: {
    id: string
    teamId: string
    organizationId: string
    status: string
    updatedBy: string
  }) => void
  taskCreated: (data: {
    id: string
    teamId: string
    organizationId: string
    task: any
    createdBy: string
  }) => void
  taskDeleted: (data: {
    id: string
    teamId: string
    organizationId: string
    deletedBy: string
  }) => void
  epicUpdated: (data: {
    id: string
    teamId?: string
    organizationId: string
    updatedBy: string
  }) => void
  userJoined: (data: {
    userId: string
    userName: string
    teamId: string
  }) => void
  userLeft: (data: {
    userId: string
    teamId: string
  }) => void
}

export interface ClientToServerEvents {
  joinTeam: (teamId: string) => void
  leaveTeam: (teamId: string) => void
  joinOrganization: (organizationId: string) => void
  leaveOrganization: (organizationId: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  userName: string
  userEmail: string
  teams: string[]
  organizations: string[]
}