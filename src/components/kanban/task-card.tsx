'use client'

import { Clock, User } from 'lucide-react'

interface TaskCardAssignee {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TaskCardLabel {
  label: {
    id: string
    name: string
    color: string
  }
}

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string | null
    status: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    assignee: TaskCardAssignee | null
    estimation: number | null
    labels: TaskCardLabel[]
    team?: { id: string; name: string } | null
  }
  onClick?: () => void
}

const priorityColors = {
  LOW: 'border-l-green-500',
  MEDIUM: 'border-l-yellow-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-500',
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const hasAssignee = !!task.assignee
  const assigneeName = hasAssignee ? (task.assignee?.name || task.assignee?.email || 'Unassigned') : 'Unassigned'
  const teamName = task.team?.name || null
  const rawImage = task.assignee?.image || null
  const avatarSrc = rawImage
    ? rawImage.startsWith('https://lh3.googleusercontent.com/')
      ? `/api/proxy/image?url=${encodeURIComponent(rawImage)}`
      : rawImage
    : null
  const assigneeInitial = assigneeName.charAt(0).toUpperCase()

  const metaTitle = teamName ? `${assigneeName} • ${teamName}` : assigneeName

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-lg border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors]} shadow-sm hover:shadow-md dark:shadow-zinc-900/20 dark:hover:shadow-zinc-900/30 transition-all cursor-pointer p-4 border border-gray-200 dark:border-zinc-700`}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-zinc-100 line-clamp-2">{task.title}</h4>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
            {hasAssignee ? (
              avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={assigneeName}
                  className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-zinc-600 object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/default-avatar.svg'
                  }}
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-zinc-600 bg-gray-200 dark:bg-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-200">
                  {assigneeInitial}
                </div>
              )
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-zinc-600 bg-gray-200 dark:bg-zinc-700">
                <User className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-300" />
              </div>
            )}
            <span className="truncate max-w-[200px] text-gray-700 dark:text-zinc-200" title={metaTitle}>
              {metaTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            task.priority === 'URGENT' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
            task.priority === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
            task.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
          }`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400">
            <Clock className="h-4 w-4" />
            <span>{task.estimation ? `${task.estimation}h` : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
