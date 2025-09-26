'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useSocket } from '@/contexts/socket-context'

export function ConnectionStatus() {
  const { isConnected } = useSocket()

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Wifi className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Live</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <WifiOff className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Offline</span>
        </div>
      )}
    </div>
  )
}