'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import {
  ServerToClientEvents,
  ClientToServerEvents
} from '@/lib/socket'

type SocketContextType = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
  joinTeam: (teamId: string) => void
  leaveTeam: (teamId: string) => void
  joinOrganization: (organizationId: string) => void
  leaveOrganization: (organizationId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinTeam: () => {},
  leaveTeam: () => {},
  joinOrganization: () => {},
  leaveOrganization: () => {}
})

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Initialize socket connection
    const socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/api/socket/io',
      addTrailingSlash: false
    })

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server')
      setIsConnected(true)
      
      // Set user data on connection
      socketInstance.emit('joinUser' as any, {
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        userEmail: session.user.email
      })
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.close()
    }
  }, [session?.user])

  const joinTeam = (teamId: string) => {
    if (socket) {
      socket.emit('joinTeam', teamId)
    }
  }

  const leaveTeam = (teamId: string) => {
    if (socket) {
      socket.emit('leaveTeam', teamId)
    }
  }

  const joinOrganization = (organizationId: string) => {
    if (socket) {
      socket.emit('joinOrganization', organizationId)
    }
  }

  const leaveOrganization = (organizationId: string) => {
    if (socket) {
      socket.emit('leaveOrganization', organizationId)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTeam,
        leaveTeam,
        joinOrganization,
        leaveOrganization
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}