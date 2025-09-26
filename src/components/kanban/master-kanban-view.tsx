'use client'

import { useState, useEffect, useCallback } from 'react'
import { Filter, Search, Users, Building } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { DraggableTaskCard } from './draggable-task-card'
import { TaskDetailsModal } from './task-details-modal'
import { useSocket } from '@/contexts/socket-context'

const columns = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'TODO', title: 'Todo', color: 'bg-blue-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-100' },
  { id: 'ON_HOLD', title: 'On Hold', color: 'bg-orange-100' },
  { id: 'DONE', title: 'Done', color: 'bg-green-100' },
]

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
  team: {
    id: string
    name: string
  }
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
  _count: {
    subtasks: number
  }
}

interface Organization {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  organizationId: string
}

export function MasterKanbanView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Filters
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [assignees, setAssignees] = useState<Array<{id: string, name: string | null, email: string}>>([])
  const [priorities] = useState(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  // Real-time socket connection
  const { socket, joinTeam, leaveTeam, joinOrganization, leaveOrganization } = useSocket()
  
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
      const params = new URLSearchParams()

      if (selectedTeamIds.length > 0) {
        selectedTeamIds.forEach(teamId => {
          params.append('teamId', teamId)
        })
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedTeamIds])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Set up real-time listeners
  useEffect(() => {
    if (!socket) return

    const handleTaskUpdated = (data: any) => {
      setTasks(prev => prev.map(task => 
        task.id === data.id 
          ? { ...task, status: data.status }
          : task
      ))
    }

    const handleTaskCreated = (data: any) => {
      // Refetch tasks to get the complete task data
      fetchTasks()
    }

    const handleTaskDeleted = (data: any) => {
      setTasks(prev => prev.filter(task => task.id !== data.id))
    }

    socket.on('taskUpdated', handleTaskUpdated)
    socket.on('taskCreated', handleTaskCreated)
    socket.on('taskDeleted', handleTaskDeleted)

    return () => {
      socket.off('taskUpdated', handleTaskUpdated)
      socket.off('taskCreated', handleTaskCreated)
      socket.off('taskDeleted', handleTaskDeleted)
    }
  }, [socket, fetchTasks])

  // Join team/organization rooms when filters change
  useEffect(() => {
    if (!socket) return

    // Join organization room
    if (selectedOrgId) {
      joinOrganization(selectedOrgId)
    }

    // Join team rooms
    selectedTeamIds.forEach(teamId => {
      joinTeam(teamId)
    })

    return () => {
      if (selectedOrgId) {
        leaveOrganization(selectedOrgId)
      }
      selectedTeamIds.forEach(teamId => {
        leaveTeam(teamId)
      })
    }
  }, [socket, selectedOrgId, selectedTeamIds, joinTeam, leaveTeam, joinOrganization, leaveOrganization])

  const fetchData = async () => {
    try {
      const [orgsResponse, teamsResponse, tasksResponse] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/teams'),
        fetch('/api/tasks')
      ])

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        setOrganizations(orgsData)
      }

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData)
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        
        // Extract unique assignees from tasks
        const uniqueAssignees = new Map()
        tasksData.forEach((task: Task) => {
          if (task.assignee) {
            uniqueAssignees.set(task.assignee.id, {
              id: task.assignee.id,
              name: task.assignee.name,
              email: task.assignee.email
            })
          }
        })
        setAssignees(Array.from(uniqueAssignees.values()))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }


  const filteredTeams = selectedOrgId 
    ? teams.filter(team => team.organizationId === selectedOrgId)
    : teams

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter(task => task.status === status)

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.assignee?.name && task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.team.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply assignee filter
    if (selectedAssigneeId) {
      if (selectedAssigneeId === 'unassigned') {
        filtered = filtered.filter(task => !task.assignee)
      } else {
        filtered = filtered.filter(task => task.assignee?.id === selectedAssigneeId)
      }
    }

    // Apply priority filter
    if (selectedPriority) {
      filtered = filtered.filter(task => task.priority === selectedPriority)
    }

    return filtered
  }

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
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

  const totalTasks = tasks.length
  const totalTeams = selectedTeamIds.length || teams.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 sm:p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                {organizations.length} Organizations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                {totalTeams} Teams
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">
              {totalTasks} tasks total
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Search tasks, assignees, or teams..."
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Organization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value)
                    setSelectedTeamIds([]) // Reset team selection
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                >
                  <option value="">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Assignee
                </label>
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                >
                  <option value="">All Assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name || assignee.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                >
                  <option value="">All Priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0) + priority.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team Filter Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Teams ({selectedTeamIds.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900">
                {filteredTeams.map((team) => (
                  <label key={team.id} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={() => handleTeamToggle(team.id)}
                      className="rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-zinc-100">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedOrgId('')
                  setSelectedTeamIds([])
                  setSelectedAssigneeId('')
                  setSelectedPriority('')
                  setSearchTerm('')
                }}
                className="px-3 py-1 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={getTasksByStatus(column.id).length}
            >
              {getTasksByStatus(column.id).map((task) => (
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

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {selectedTeamIds.length > 0 
              ? "No tasks found for the selected teams"
              : "You don't have access to any tasks yet"
            }
          </p>
        </div>
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