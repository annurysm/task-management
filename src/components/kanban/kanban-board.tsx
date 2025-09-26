'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { DraggableTaskCard } from './draggable-task-card'
import { CreateTaskModal, TaskCreatePayload, TaskSubmissionResult } from './create-task-modal'
import { ColumnSettingsModal } from './column-settings-modal'
import { TaskDetailsModal } from './task-details-modal'

interface Column {
  id: string
  title: string
  status: string
  color: string
  position: number
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  estimation: number | null
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  epic: {
    id: string
    title: string
    status: string
  } | null
  labels: Array<{
    label: {
      id: string
      name: string
      color: string
    }
  }>
  team?: {
    id: string
    name: string
  } | null
  _count: {
    subtasks: number
  }
}

interface KanbanBoardProps {
  teamId?: string
}

export function KanbanBoard({ teamId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const fetchTasks = useCallback(async () => {
    try {
      let url = '/api/tasks'
      if (teamId) {
        url += `?teamId=${teamId}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [teamId])

  const fetchColumns = useCallback(async () => {
    if (!teamId) return
    
    try {
      const response = await fetch(`/api/teams/${teamId}/columns`)
      if (response.ok) {
        const data = await response.json()
        setColumns(data)
      }
    } catch (error) {
      console.error('Error fetching columns:', error)
    }
  }, [teamId])

  useEffect(() => {
    const fetchData = async () => {
      if (teamId) {
        await Promise.all([fetchTasks(), fetchColumns()])
      } else {
        await fetchTasks()
      }
      setLoading(false)
    }
    fetchData()
  }, [fetchTasks, fetchColumns, teamId])

  const handleCreateTask = async (taskData: TaskCreatePayload): Promise<TaskSubmissionResult> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, teamId })
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorBody.error || 'Failed to create task'
        }
      }

      await fetchTasks()
      setShowCreateTask(null)
      return { success: true }
    } catch (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create task'
      }
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // If dropping in the same column, do nothing
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistically update the UI
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    // Update the task status via API
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        // Revert the optimistic update on error
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: task.status } : t
        ))
        console.error('Failed to update task status')
      }
    } catch (error) {
      // Revert the optimistic update on error
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: task.status } : t
      ))
      console.error('Error updating task status:', error)
    }
  }

  // Fallback columns if no team-specific columns exist
  const defaultColumns = [
    { id: 'BACKLOG', title: 'Backlog', status: 'BACKLOG', color: 'bg-gray-100', position: 1000 },
    { id: 'TODO', title: 'Todo', status: 'TODO', color: 'bg-blue-100', position: 2000 },
    { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', color: 'bg-yellow-100', position: 3000 },
    { id: 'IN_REVIEW', title: 'In Review', status: 'IN_REVIEW', color: 'bg-purple-100', position: 4000 },
    { id: 'ON_HOLD', title: 'On Hold', status: 'ON_HOLD', color: 'bg-orange-100', position: 5000 },
    { id: 'DONE', title: 'Done', status: 'DONE', color: 'bg-green-100', position: 6000 },
  ]

  const displayColumns = teamId && columns.length > 0 ? columns : defaultColumns

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Team Kanban Board</h2>
          <p className="text-gray-600 dark:text-zinc-400">Manage your team's tasks and track progress</p>
        </div>
        {teamId && (
          <button
            onClick={() => setShowColumnSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Customize Columns
          </button>
        )}
      </div>
      
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          {displayColumns.map((column) => (
            <KanbanColumn
              key={column.status}
              id={column.status}
              title={column.title}
              color={column.color}
              count={getTasksByStatus(column.status).length}
              onAddTask={teamId ? () => setShowCreateTask(column.status) : undefined}
            >
              {getTasksByStatus(column.status).map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  id={task.id}
                  task={task}
                  onTaskClick={() => setSelectedTask(task)}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 transform">
              <TaskCard
                task={activeTask}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      {showCreateTask && teamId && (
        <CreateTaskModal
          teamId={teamId}
          initialStatus={showCreateTask}
          onClose={() => setShowCreateTask(null)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Column Settings Modal */}
      {showColumnSettings && teamId && (
        <ColumnSettingsModal
          teamId={teamId}
          columns={columns}
          onClose={() => setShowColumnSettings(false)}
          onColumnsUpdate={fetchColumns}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || '',
            status: selectedTask.status,
            priority: selectedTask.priority,
            assignee: selectedTask.assignee ? {
              name: selectedTask.assignee.name || selectedTask.assignee.email,
              avatar: selectedTask.assignee.image?.startsWith('https://lh3.googleusercontent.com/')
                ? `/api/proxy/image?url=${encodeURIComponent(selectedTask.assignee.image)}`
                : selectedTask.assignee.image || '/default-avatar.svg'
            } : null,
            estimation: selectedTask.estimation || 0,
            epic: selectedTask.epic ? {
              id: selectedTask.epic.id,
              title: selectedTask.epic.title,
              status: selectedTask.epic.status
            } : null,
            labels: selectedTask.labels.map(({ label }) => ({
              id: label.id,
              name: label.name,
              color: label.color
            }))
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
