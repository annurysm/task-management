'use client'

import { useState } from 'react'
import { Calendar, Users, MoreHorizontal, Plus, CheckCircle } from 'lucide-react'

interface ObjectiveCardProps {
  objective: {
    id: string
    title: string
    description: string | null
    tasks: Array<{
      objectiveId: string
      taskId: string | null
      epicId: string | null
      weekStartDate: string | null
      weekPriority: number | null
      assignedTeam: string | null
      isCommitted: boolean
      task: any
      epic: any
    }>
    weeklySyncs: Array<{
      id: string
      weekStartDate: string
      notes: string | null
    }>
    _count: {
      tasks: number
    }
  }
  onPlanWeekly: () => void
  onRefresh: () => void
}

export function ObjectiveCard({ objective, onPlanWeekly, onRefresh }: ObjectiveCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Calculate progress
  const totalTasks = objective.tasks.length
  const completedTasks = objective.tasks.filter(t => t.task?.status === 'DONE').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Get unique teams working on this objective
  const teams = [...new Set(objective.tasks.map(t => t.assignedTeam || t.task?.team?.name).filter(Boolean))]

  // Get this week's tasks
  const currentWeekStart = new Date()
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())
  const currentWeekISO = currentWeekStart.toISOString().split('T')[0]
  
  const thisWeekTasks = objective.tasks.filter(t => t.weekStartDate === currentWeekISO)
  const committedThisWeek = thisWeekTasks.filter(t => t.isCommitted).length

  // Status distribution
  const statusCounts = objective.tasks.reduce((acc: any, task) => {
    const status = task.task?.status || 'UNKNOWN'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusColors: { [key: string]: string } = {
    BACKLOG: 'bg-gray-500',
    TODO: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    IN_REVIEW: 'bg-purple-500',
    ON_HOLD: 'bg-orange-500',
    DONE: 'bg-green-500',
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">{objective.title}</h3>
          {objective.description && (
            <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">{objective.description}</p>
          )}
        </div>
        <button className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{teams.length}</div>
          <div className="text-xs text-gray-600 dark:text-zinc-400">Teams Involved</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-400">
            {committedThisWeek}/{thisWeekTasks.length}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Week Committed</div>
        </div>
      </div>

      {/* Status Distribution */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-zinc-400">Status Breakdown</span>
          </div>
          <div className="flex h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className={statusColors[status] || 'bg-gray-400'}
                style={{ width: `${((count as number) / totalTasks) * 100}%` }}
                title={`${status}: ${count} tasks`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      {teams.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Users className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <span className="text-sm text-gray-600 dark:text-zinc-400">Contributing Teams</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teams.slice(0, 3).map((team) => (
              <span
                key={team}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300"
              >
                {team}
              </span>
            ))}
            {teams.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                +{teams.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {objective.weeklySyncs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <span className="text-sm text-gray-600 dark:text-zinc-400">Last Sync</span>
          </div>
          <div className="text-sm text-gray-900 dark:text-zinc-100">
            {new Date(objective.weeklySyncs[0].weekStartDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onPlanWeekly}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
        >
          <Calendar className="h-4 w-4" />
          Weekly Plan
        </button>
        <button className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-zinc-300 px-3 py-2 rounded text-sm font-medium flex items-center justify-center">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-zinc-100">Recent Tasks</h4>
            {objective.tasks.slice(0, 5).map((objTask, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <span className="text-gray-900 dark:text-zinc-100">{objTask.task?.title || objTask.epic?.title}</span>
                  <span className="text-gray-500 dark:text-zinc-400 ml-2">
                    ({objTask.assignedTeam || objTask.task?.team?.name})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {objTask.isCommitted && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    objTask.task?.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    objTask.task?.status === 'IN_PROGRESS' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                    'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300'
                  }`}>
                    {objTask.task?.status?.replace('_', ' ').toLowerCase() || 'planned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Details */}
      {totalTasks > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-3 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showDetails ? 'Show Less' : `Show ${totalTasks} Tasks`}
        </button>
      )}
    </div>
  )
}