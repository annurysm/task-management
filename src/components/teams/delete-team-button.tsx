'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteTeamButtonProps {
  teamId: string
  teamName: string
}

export function DeleteTeamButton({ teamId, teamName }: DeleteTeamButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/teams')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Failed to delete team')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Delete Team
        </>
      )}
    </button>
  )
}