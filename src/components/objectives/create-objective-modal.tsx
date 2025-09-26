'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateObjectiveModalProps {
  onClose: () => void
  onSubmit: (title: string, description: string) => Promise<void>
}

export function CreateObjectiveModal({ onClose, onSubmit }: CreateObjectiveModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onSubmit(title.trim(), description.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Create Objective</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Objective Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Q1 Mobile App Launch"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe the strategic objective and its goals"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Objective'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}