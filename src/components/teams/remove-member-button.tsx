'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RemoveMemberButtonProps {
  teamId: string
  memberId: string
  memberName?: string | null
  disabled?: boolean
}

export function RemoveMemberButton({ teamId, memberId, memberName, disabled }: RemoveMemberButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (disabled) return
    const confirmRemove = window.confirm(`Remove ${memberName || 'this member'} from the team?`)
    if (!confirmRemove) return

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to remove member')
      }

      router.refresh()
    } catch (error) {
      console.error('Error removing member:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={disabled || isRemoving}
      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRemoving ? 'Removing...' : 'Remove'}
    </button>
  )
}
