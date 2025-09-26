'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, Calendar, Users, CheckCircle, Clock, MoreHorizontal } from 'lucide-react'

interface Epic {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  createdAt: string
  team: {
    id: string
    name: string
    organization: {
      id: string
      name: string
    }
  }
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  tasks: Array<{
    id: string
    title: string
    status: string
  }>
  _count: {
    tasks: number
  }
}

interface EpicCardProps {
  epic: Epic
  onView: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

export function EpicCard({ epic, onView, onUpdate, onDelete }: EpicCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [editStatus, setEditStatus] = useState(epic.status)

  // Calculate progress
  const totalTasks = epic._count.tasks
  const completedTasks = epic.tasks.filter(task => task.status === 'DONE').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const statusColors: { [key: string]: string } = {
    PLANNING: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-zinc-400',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    ON_HOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
  }

  const statusDotColors: { [key: string]: string } = {
    PLANNING: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    ON_HOLD: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500'
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await onUpdate(epic.id, {
        title: epic.title,
        description: epic.description,
        status: newStatus,
        dueDate: epic.dueDate
      })
      setEditStatus(newStatus)
      setShowQuickEdit(false)
    } catch (error) {
      console.error('Failed to update epic status:', error)
      alert('Unable to update epic status. Please try again.')
    }
  }

  const handleDelete = () => {
    if (totalTasks > 0) {
      alert('Cannot delete epic with existing tasks. Please reassign or delete tasks first.')
      return
    }
    if (confirm(`Are you sure you want to delete "${epic.title}"?`)) {
      onDelete(epic.id).catch((error: unknown) => {
        console.error('Failed to delete epic:', error)
        alert('Unable to delete epic. Please try again.')
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = epic.dueDate && new Date(epic.dueDate) < new Date() && epic.status !== 'COMPLETED'

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${statusDotColors[epic.status]}`}></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1">{epic.title}</h3>
          </div>
          {epic.description && (
            <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 mb-2">{epic.description}</p>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onView()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <Eye className="h-3 w-3" />
                View Details
              </button>
              <button
                onClick={() => {
                  setShowQuickEdit(true)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <Edit className="h-3 w-3" />
                Quick Edit
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                disabled={totalTasks > 0}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Edit */}
      {showQuickEdit && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            Update Status:
          </label>
          <div className="flex gap-2">
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-zinc-600 rounded px-2 py-1 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={() => handleStatusChange(editStatus)}
              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowQuickEdit(false)}
              className="bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 px-3 py-1 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[epic.status]}`}>
          {epic.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {epic.team?.organization?.name || 'Unknown Organization'} • {epic.team?.name || 'Unknown Team'}
        </span>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-zinc-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-zinc-100">
              {completedTasks}/{totalTasks} tasks ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2">
        {epic.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <span className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-zinc-400'}`}>
              Due {formatDate(epic.dueDate)}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <Users className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <span>Created by {epic.createdBy?.name || epic.createdBy?.email || 'Unknown'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <span>Created {formatDate(epic.createdAt)}</span>
        </div>
      </div>

      {/* Task Summary */}
      {totalTasks > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-zinc-400">{totalTasks} tasks</span>
            {completedTasks > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>{completedTasks} completed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onView}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Epic Details
        </button>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
