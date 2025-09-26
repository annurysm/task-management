'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

interface InviteMemberButtonProps {
  teamId: string
  onMemberAdded?: () => void
}

export function InviteMemberButton({ teamId, onMemberAdded }: InviteMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MEMBER' | 'LEAD'>('MEMBER')
  const [isInviting, setIsInviting] = useState(false)
  const router = useRouter()

  const handleInvite = async () => {
    if (!email.trim()) {
      alert('Please enter an email address')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      if (response.ok) {
        alert('Member invited successfully!')
        setEmail('')
        setRole('MEMBER')
        setIsOpen(false)
        onMemberAdded?.()
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to invite member')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      alert('Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Invite Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">
              Invite Team Member
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'MEMBER' | 'LEAD')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Lead</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={isInviting}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}