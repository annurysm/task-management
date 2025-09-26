'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { X, User, CheckCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'task' | 'epic' | 'user'
  message: string
  timestamp: Date
  userId?: string
  userName?: string
}

export function RealTimeNotifications() {
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!socket) return

    const handleTaskUpdated = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'task',
        message: `Task updated by ${data.updatedBy}`,
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev].slice(0, 5))
    }

    const handleTaskCreated = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'task',
        message: `New task "${data.task.title}" created by ${data.createdBy}`,
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev].slice(0, 5))
    }

    const handleUserJoined = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'user',
        message: `${data.userName} joined the team`,
        timestamp: new Date(),
        userId: data.userId,
        userName: data.userName
      }
      setNotifications(prev => [notification, ...prev].slice(0, 5))
    }

    const handleEpicUpdated = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'epic',
        message: `Epic updated by ${data.updatedBy}`,
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev].slice(0, 5))
    }

    // Listen for events
    socket.on('taskUpdated', handleTaskUpdated)
    socket.on('taskCreated', handleTaskCreated)
    socket.on('userJoined', handleUserJoined)
    socket.on('epicUpdated', handleEpicUpdated)

    return () => {
      socket.off('taskUpdated', handleTaskUpdated)
      socket.off('taskCreated', handleTaskCreated)
      socket.off('userJoined', handleUserJoined)
      socket.off('epicUpdated', handleEpicUpdated)
    }
  }, [socket])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <div className="flex-shrink-0 mt-0.5">
            {notification.type === 'task' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {notification.type === 'user' && (
              <User className="h-5 w-5 text-blue-500" />
            )}
            {notification.type === 'epic' && (
              <CheckCircle className="h-5 w-5 text-purple-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-zinc-100">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  )
}