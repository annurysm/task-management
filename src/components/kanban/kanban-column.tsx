'use client'

import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: React.ReactNode
  onAddTask?: () => void
}

export function KanbanColumn({ id, title, color, count, children, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex-shrink-0 w-64 sm:w-72">
      <div className={`${color} dark:${color.replace('bg-', 'bg-zinc-800 border-l-4 border-l-')} rounded-lg p-3 sm:p-4 mb-4 transition-colors`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm sm:text-base">{title}</h3>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">{count} tasks</span>
          </div>
          {onAddTask && (
            <button 
              onClick={onAddTask}
              className="p-1 hover:bg-white/50 dark:hover:bg-zinc-700/50 rounded transition-colors"
            >
              <Plus className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
            </button>
          )}
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`space-y-3 min-h-[400px] sm:min-h-[500px] p-2 rounded-lg transition-colors border-2 ${
          isOver 
            ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-500 border-dashed' 
            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-600 border-solid'
        }`}
      >
        {children}
      </div>
    </div>
  )
}