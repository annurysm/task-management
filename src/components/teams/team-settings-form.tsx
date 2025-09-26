'use client'

import { useState } from 'react'

interface TeamSettingsFormProps {
  teamId: string
  initialName: string
  initialDescription: string | null
  isAdmin: boolean
}

export function TeamSettingsForm({ teamId, initialName, initialDescription, isAdmin }: TeamSettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (response.ok) {
        alert('Team settings saved successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save team settings')
      }
    } catch (error) {
      console.error('Error saving team settings:', error)
      alert('Failed to save team settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
          Team Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isAdmin}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isAdmin}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
          placeholder="Team description..."
        />
      </div>
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}