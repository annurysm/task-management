'use client'

import { useDraggable } from '@dnd-kit/core'
import { TaskCard } from './task-card'

interface DraggableTaskCardProps {
  id: string
  task: any
  onTaskClick?: () => void
}

export function DraggableTaskCard({ id, task, onTaskClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const handleTaskClick = (e: React.MouseEvent) => {
    // Only trigger task click if not dragging and clicked on task content (not drag handles)
    if (!isDragging && onTaskClick) {
      e.stopPropagation()
      onTaskClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <TaskCard task={task} onClick={handleTaskClick} />
    </div>
  )
}
