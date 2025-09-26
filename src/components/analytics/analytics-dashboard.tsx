'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Target,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasksCount: number
  averageCompletionTime: number
  teamStats: Array<{
    teamName: string
    totalTasks: number
    completedTasks: number
    completionRate: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  priorityDistribution: Array<{
    priority: string
    count: number
    percentage: number
  }>
  velocityData: Array<{
    week: string
    completed: number
    created: number
  }>
}

const statusColors: { [key: string]: string } = {
  BACKLOG: 'bg-gray-500',
  TODO: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  IN_REVIEW: 'bg-purple-500',
  ON_HOLD: 'bg-orange-500',
  DONE: 'bg-green-500',
}

const priorityColors: { [key: string]: string } = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">No analytics data</h3>
        <p className="text-gray-600 dark:text-zinc-400">Start creating tasks to see analytics</p>
      </div>
    )
  }

  const completionRate = data.totalTasks > 0 
    ? Math.round((data.completedTasks / data.totalTasks) * 100) 
    : 0

  return (
    <div className="space-y-8">
      {/* Time Period Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Time Period:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-1 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{data.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{data.completedTasks}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{completionRate}% completion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{data.inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{data.overdueTasksCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Task Status Distribution</h3>
          <div className="space-y-3">
            {data.statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[item.status]}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {item.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{item.count}</span>
                  <div className="w-20 bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${statusColors[item.status]}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {data.priorityDistribution.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${priorityColors[item.priority]}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-zinc-400">{item.count}</span>
                  <div className="w-20 bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${priorityColors[item.priority]}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Team Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.teamStats.map((team) => (
            <div key={team.teamName} className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
                <h4 className="font-semibold text-gray-900 dark:text-zinc-100">{team.teamName}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-zinc-400">Total Tasks:</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100">{team.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-zinc-400">Completed:</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100">{team.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-zinc-400">Completion Rate:</span>
                  <span className={`font-medium ${
                    team.completionRate >= 80 ? 'text-green-600' : 
                    team.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {team.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Velocity Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">Task Velocity</h3>
        <div className="space-y-4">
          {data.velocityData.map((week) => (
            <div key={week.week} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium text-gray-700 dark:text-zinc-300">{week.week}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-6 relative">
                  <div
                    className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min((week.completed / Math.max(week.created, week.completed)) * 100, 100)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{week.completed}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">
                  {week.completed} completed / {week.created} created
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}