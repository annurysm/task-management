'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Label {
  id: string
  name: string
  color: string
}

interface EditLabelModalProps {
  label: Label
  onClose: () => void
  onSubmit: (id: string, name: string, color: string) => Promise<void>
}

const predefinedColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280',
]

export function EditLabelModal({ label, onClose, onSubmit }: EditLabelModalProps) {
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)
  const [customColor, setCustomColor] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit(label.id, name.trim(), customColor || color)
    } finally {
      setLoading(false)
    }
  }

  const selectedColor = customColor || color

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Edit Label</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Label Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter label name"
              required
            />
          </div>

          {/* Label Preview */}
          {name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Preview
              </label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {name}
              </span>
            </div>
          )}

          {/* Predefined Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {predefinedColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    setColor(presetColor)
                    setCustomColor('')
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === presetColor && !customColor
                      ? 'border-gray-900 dark:border-gray-100 scale-110'
                      : 'border-gray-300 dark:border-zinc-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div>
              <label htmlFor="customColor" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Custom Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="customColor"
                  value={selectedColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 dark:border-zinc-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Hex color code"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Label'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}