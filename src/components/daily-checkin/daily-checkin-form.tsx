'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, AlertCircle, MessageSquare, Battery, Heart } from 'lucide-react'

interface Team {
  id: string
  name: string
}

interface DailyCheckinFormProps {
  onClose: () => void
  onSubmit: () => void
  selectedDate?: string
  onSelectedDateChange?: (date: string) => void
  mode?: 'create' | 'edit'
  checkinId?: string
  initialValues?: DailyCheckinFormInitialValues
}

interface DailyCheckinFormInitialValues {
  teamId: string
  date: string
  todayGoals: string
  blockers: string | null
  mood: string
  energyLevel: number
  notes: string | null
}

export function DailyCheckinForm({
  onClose,
  onSubmit,
  selectedDate: selectedDateProp,
  onSelectedDateChange,
  mode = 'create',
  checkinId,
  initialValues,
}: DailyCheckinFormProps) {
  const isEditMode = mode === 'edit'

  const formatDateForInput = (value: string | undefined | null) => {
    if (!value) return new Date().toISOString().split('T')[0]
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value.split('T')[0]
    }
    return parsed.toISOString().split('T')[0]
  }

  const energyLabels: Record<number, string> = {
    1: 'Very low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very high',
  }

  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState(
    initialValues?.teamId ?? ''
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [checkinDate, setCheckinDate] = useState(() =>
    initialValues ? formatDateForInput(initialValues.date) : selectedDateProp ?? new Date().toISOString().split('T')[0]
  )
  const [todayGoals, setTodayGoals] = useState(initialValues?.todayGoals ?? '')
  const [blockers, setBlockers] = useState(initialValues?.blockers ?? '')
  const [mood, setMood] = useState(initialValues?.mood ?? '')
  const [energyLevel, setEnergyLevel] = useState(initialValues?.energyLevel ?? 3)
  const [notes, setNotes] = useState(initialValues?.notes ?? '')

  const modalTitle = isEditMode ? 'Edit Daily Check-in' : 'Daily Check-in'
  const submitLabel = isEditMode ? 'Update Check-in' : 'Submit Check-in'
  const energyDescription = energyLabels[energyLevel]

  const moodOptions = [
    { value: 'EXCELLENT', label: 'Excellent', emoji: '😄', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'GOOD', label: 'Good', emoji: '😊', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'OKAY', label: 'Okay', emoji: '😐', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'STRUGGLING', label: 'Struggling', emoji: '😔', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
        if (data.length > 0 && !selectedTeam && !isEditMode) {
          setSelectedTeam(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }, [isEditMode, selectedTeam])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!isEditMode && selectedDateProp && selectedDateProp !== checkinDate) {
      setCheckinDate(selectedDateProp)
    }
  }, [selectedDateProp, checkinDate, isEditMode])

  useEffect(() => {
    if (initialValues) {
      setSelectedTeam(initialValues.teamId)
      setCheckinDate(formatDateForInput(initialValues.date))
      setTodayGoals(initialValues.todayGoals)
      setBlockers(initialValues.blockers ?? '')
      setMood(initialValues.mood)
      setEnergyLevel(initialValues.energyLevel)
      setNotes(initialValues.notes ?? '')
    }
  }, [initialValues])

  const handleDateChange = (value: string) => {
    setCheckinDate(value)
    if (!isEditMode) {
      onSelectedDateChange?.(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam || !todayGoals || !mood || !checkinDate) {
      alert('Please fill in all required fields, including the check-in date')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (isEditMode) {
        if (!checkinId) {
          throw new Error('Missing check-in identifier')
        }

        const response = await fetch(`/api/daily-checkin/${checkinId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            todayGoals,
            blockers,
            mood,
            energyLevel,
            notes,
          }),
        })

        if (!response.ok) {
          const isJson = response.headers.get('content-type')?.includes('application/json')
          const errorBody = isJson ? await response.json().catch(() => ({})) : {}
          throw new Error(errorBody.error || 'Failed to update check-in. Please try again.')
        }
      } else {
        const response = await fetch('/api/daily-checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: selectedTeam,
            date: checkinDate,
            todayGoals,
            blockers,
            mood,
            energyLevel,
            notes,
          }),
        })

        if (!response.ok) {
          const isJson = response.headers.get('content-type')?.includes('application/json')
          const errorBody = isJson ? await response.json().catch(() => ({})) : {}
          let message = errorBody.error || 'Failed to submit check-in. Please try again.'
          if (response.status === 409) {
            let formattedDate = checkinDate
            try {
              formattedDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(checkinDate))
            } catch (formatError) {
              console.error('Failed to format check-in date:', formatError)
            }
            message = `You've already submitted a check-in for ${formattedDate} for this team. You can edit it from the dashboard if you need to make changes.`
          }
          throw new Error(message)
        }
      }

      onSubmit()
      onClose()
    } catch (error) {
      console.error('Error submitting check-in:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Unexpected error submitting check-in. Please try again in a moment.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-4/5 xl:w-4/5 shadow-lg rounded-lg bg-white dark:bg-zinc-900 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}
            
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Team *
              </label>
              {teams.length > 0 ? (
                <>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    disabled={isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-700"
                    required
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                      Team selection cannot be changed for an existing check-in.
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 border border-gray-300 dark:border-zinc-600 rounded-md bg-gray-50 dark:bg-zinc-800">
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
                    No teams available. You need to be a member of a team to submit daily check-ins.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href="/dashboard/organization"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded-md transition-colors"
                    >
                      Create Organization
                    </a>
                    <a
                      href="/dashboard/teams"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 rounded-md transition-colors"
                    >
                      Manage Teams
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Check-in Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                value={checkinDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isEditMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-700"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                {isEditMode
                  ? 'The original check-in date is shown for reference.'
                  : 'This determines which day the check-in is recorded for. Pick a future date to plan ahead.'}
              </p>
            </div>

            {/* Today's Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                What are your goals for today? *
              </label>
              <textarea
                value={todayGoals}
                onChange={(e) => setTodayGoals(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="List your main objectives and priorities for today..."
                required
              />
            </div>

            {/* Blockers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Any blockers or concerns?
              </label>
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describe any obstacles or challenges you're facing..."
              />
            </div>

            {/* Mood and Energy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  <Heart className="h-4 w-4 inline mr-1" />
                  How are you feeling today? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {moodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMood(option.value)}
                      className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                        mood === option.value
                          ? `${option.color} border-current`
                          : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <div className="text-lg mb-1">{option.emoji}</div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  <Battery className="h-4 w-4 inline mr-1" />
                  Energy Level
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="flex-1 accent-orange-600"
                  />
                  <div className="flex flex-col min-w-[120px]">
                    <span className="text-sm font-medium text-gray-900 dark:text-zinc-100 capitalize">
                      {energyDescription.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">{energyLevel} / 5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Any other thoughts or updates you'd like to share..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTeam || !todayGoals || !mood}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {submitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
