'use client'

import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Column {
  id: string
  title: string
  status: string
  color: string
  position: number
}

interface ColumnSettingsModalProps {
  teamId: string
  columns: Column[]
  onClose: () => void
  onColumnsUpdate: () => void
}

const colorOptions = [
  { label: 'Gray', value: 'bg-gray-100', textColor: 'text-gray-800' },
  { label: 'Blue', value: 'bg-blue-100', textColor: 'text-blue-800' },
  { label: 'Yellow', value: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { label: 'Purple', value: 'bg-purple-100', textColor: 'text-purple-800' },
  { label: 'Orange', value: 'bg-orange-100', textColor: 'text-orange-800' },
  { label: 'Green', value: 'bg-green-100', textColor: 'text-green-800' },
  { label: 'Red', value: 'bg-red-100', textColor: 'text-red-800' },
  { label: 'Pink', value: 'bg-pink-100', textColor: 'text-pink-800' },
  { label: 'Indigo', value: 'bg-indigo-100', textColor: 'text-indigo-800' },
]

interface SortableColumnProps {
  column: Column
  colorOptions: typeof colorOptions
  onUpdate: (columnId: string, updates: Partial<Column>) => void
  onDelete: (columnId: string) => void
  onLocalUpdate: (columnId: string, updates: Partial<Column>) => void
}

function SortableColumn({ column, colorOptions, onUpdate, onDelete, onLocalUpdate }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
    >
      <div 
        className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
        <div className={`w-4 h-4 rounded ${column.color}`}></div>
      </div>
      
      <div className="flex-1">
        <input
          type="text"
          value={column.title}
          onChange={(e) => onLocalUpdate(column.id, { title: e.target.value })}
          onBlur={(e) => onUpdate(column.id, { title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Status: {column.status}</p>
      </div>

      <select
        value={column.color}
        onChange={(e) => {
          const newColor = e.target.value
          onLocalUpdate(column.id, { color: newColor })
          onUpdate(column.id, { color: newColor })
        }}
        className="px-3 py-2 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      >
        {colorOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => onDelete(column.id)}
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
        title="Delete column"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ColumnSettingsModal({ teamId, columns, onClose, onColumnsUpdate }: ColumnSettingsModalProps) {
  const [localColumns, setLocalColumns] = useState(columns)
  const [newColumn, setNewColumn] = useState({ title: '', status: '', color: 'bg-gray-100' })
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleUpdateColumn = async (columnId: string, updates: Partial<Column>) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setLocalColumns(prev => 
          prev.map(col => col.id === columnId ? { ...col, ...updates } : col)
        )
      }
    } catch (error) {
      console.error('Error updating column:', error)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/columns/${columnId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLocalColumns(prev => prev.filter(col => col.id !== columnId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete column')
      }
    } catch (error) {
      console.error('Error deleting column:', error)
      alert('Failed to delete column')
    }
  }

  const handleAddColumn = async () => {
    if (!newColumn.title || !newColumn.status) {
      alert('Title and status are required')
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColumn)
      })

      if (response.ok) {
        const column = await response.json()
        setLocalColumns(prev => [...prev, column])
        setNewColumn({ title: '', status: '', color: 'bg-gray-100' })
        setShowAddColumn(false)
      }
    } catch (error) {
      console.error('Error adding column:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await onColumnsUpdate()
    setSaving(false)
    onClose()
  }

  const generateStatusFromTitle = (title: string) => {
    return title.toUpperCase().replace(/\s+/g, '_')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = localColumns.findIndex((col) => col.id === active.id)
      const newIndex = localColumns.findIndex((col) => col.id === over.id)

      const reorderedColumns = arrayMove(localColumns, oldIndex, newIndex)
      
      // Update positions based on new order
      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        position: (index + 1) * 1000
      }))
      
      setLocalColumns(updatedColumns)

      // Update positions in the backend
      try {
        await Promise.all(
          updatedColumns.map((col, index) =>
            fetch(`/api/teams/${teamId}/columns/${col.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: (index + 1) * 1000 })
            })
          )
        )
      } catch (error) {
        console.error('Error updating column positions:', error)
        // Revert on error
        setLocalColumns(columns)
      }
    }
  }

  const handleLocalUpdate = (columnId: string, updates: Partial<Column>) => {
    setLocalColumns(prev => 
      prev.map(col => col.id === columnId ? { ...col, ...updates } : col)
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Customize Kanban Columns</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={localColumns.map(col => col.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {localColumns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    colorOptions={colorOptions}
                    onUpdate={handleUpdateColumn}
                    onDelete={handleDeleteColumn}
                    onLocalUpdate={handleLocalUpdate}
                  />
                ))}

                {showAddColumn ? (
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${newColumn.color}`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Column title"
                        value={newColumn.title}
                        onChange={(e) => {
                          const title = e.target.value
                          setNewColumn(prev => ({ 
                            ...prev, 
                            title, 
                            status: generateStatusFromTitle(title)
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      {newColumn.title && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Status: {newColumn.status}</p>
                      )}
                    </div>

                    <select
                      value={newColumn.color}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-2 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddColumn}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddColumn(false)
                          setNewColumn({ title: '', status: '', color: 'bg-gray-100' })
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg text-gray-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-50 dark:bg-gray-900/30"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Column
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}