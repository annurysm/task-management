import { Server as NetServer } from 'http'
import { NextRequest } from 'next/server'
import { Server as ServerIO } from 'socket.io'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '@/lib/socket'

let io: ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer: NetServer = (req as any).socket.server
    
    io = new ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    io.on('connection', (socket) => {
      console.log(`Socket ${socket.id} connected`)

      // Handle joining team rooms
      socket.on('joinTeam', (teamId: string) => {
        console.log(`Socket ${socket.id} joining team: ${teamId}`)
        socket.join(`team:${teamId}`)
        
        // Notify other team members
        socket.to(`team:${teamId}`).emit('userJoined', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          teamId
        })
      })

      // Handle leaving team rooms
      socket.on('leaveTeam', (teamId: string) => {
        console.log(`Socket ${socket.id} leaving team: ${teamId}`)
        socket.leave(`team:${teamId}`)
        
        // Notify other team members
        socket.to(`team:${teamId}`).emit('userLeft', {
          userId: socket.data.userId,
          teamId
        })
      })

      // Handle joining organization rooms
      socket.on('joinOrganization', (organizationId: string) => {
        console.log(`Socket ${socket.id} joining organization: ${organizationId}`)
        socket.join(`org:${organizationId}`)
      })

      // Handle leaving organization rooms
      socket.on('leaveOrganization', (organizationId: string) => {
        console.log(`Socket ${socket.id} leaving organization: ${organizationId}`)
        socket.leave(`org:${organizationId}`)
      })

      socket.on('disconnect', (reason) => {
        console.log(`Socket ${socket.id} disconnected: ${reason}`)
      })
    })
  }

  return new Response('Socket.IO server initialized', { status: 200 })
}