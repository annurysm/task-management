"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import {
  AlertCircle,
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Calendar,
  MoreHorizontal,
  Pencil,
  TrendingUp,
  Users
} from "lucide-react"
import { type LucideIcon } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface TaskUpdate {
  id: string
  statusUpdate: string
  hoursWorked: number | null
  comments: string | null
  task: {
    id: string
    title: string
  }
}

export interface DailyCheckin {
  id: string
  date: string
  yesterdayAccomplishments: string
  todayGoals: string
  blockers: string | null
  mood: string
  energyLevel: number
  notes: string | null
  user: User
  team?: { id: string; name: string } | null
  taskUpdates: TaskUpdate[]
}

interface Team {
  id: string
  name: string
}

interface TeamCheckinDashboardProps {
  teamId?: string
  selectedDate?: string
  onSelectedDateChange?: (date: string) => void
  onEditCheckin?: (checkin: DailyCheckin) => void
  refreshToken?: number
}

const moodEmojis: Record<string, string> = {
  EXCELLENT: "😄",
  GOOD: "😊",
  OKAY: "😐",
  STRUGGLING: "😔"
}

const moodColors: Record<string, string> = {
  EXCELLENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  GOOD: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  OKAY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRUGGLING: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

const energyLabels: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Very high"
}

const energyBadgeClasses: Record<number, string> = {
  1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  4: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  5: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
}

const energyIconColorClasses: Record<number, string> = {
  1: 'text-red-500 dark:text-red-400',
  2: 'text-orange-500 dark:text-orange-400',
  3: 'text-amber-500 dark:text-amber-400',
  4: 'text-lime-500 dark:text-lime-400',
  5: 'text-emerald-500 dark:text-emerald-400'
}

const energyIconMap: Record<number, LucideIcon> = {
  1: BatteryLow,
  2: BatteryLow,
  3: BatteryMedium,
  4: Battery,
  5: BatteryFull
}

const getJakartaDateString = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

export function TeamCheckinDashboard({
  teamId,
  selectedDate,
  onSelectedDateChange,
  onEditCheckin,
  refreshToken = 0,
}: TeamCheckinDashboardProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? null

  const [checkins, setCheckins] = useState<DailyCheckin[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState(teamId || 'ALL')
  const [internalSelectedDate, setInternalSelectedDate] = useState(getJakartaDateString)
  const currentSelectedDate = selectedDate ?? internalSelectedDate
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)

  const handleSelectedDateChange = (value: string) => {
    if (onSelectedDateChange) {
      onSelectedDateChange(value)
    } else {
      setInternalSelectedDate(value)
    }
  }

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }, [])

  const fetchCheckins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: currentSelectedDate })
      if (selectedTeam && selectedTeam !== 'ALL') {
        params.append('teamId', selectedTeam)
      }
      const response = await fetch(`/api/daily-checkin?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCheckins(data)
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error)
    } finally {
      setLoading(false)
    }
  }, [currentSelectedDate, selectedTeam, refreshToken])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    fetchCheckins()
  }, [fetchCheckins])

  useEffect(() => {
    if (!menuOpenFor) return

    const handleClickAway = () => setMenuOpenFor(null)
    document.addEventListener('click', handleClickAway)
    return () => document.removeEventListener('click', handleClickAway)
  }, [menuOpenFor])

  const memberOptions = useMemo(() => {
    const unique = new Map<string, User>()
    checkins.forEach((checkin) => {
      unique.set(checkin.user.id, checkin.user)
    })
    return Array.from(unique.values()).sort((a, b) => {
      const aName = a.name || a.email
      const bName = b.name || b.email
      return aName.localeCompare(bName)
    })
  }, [checkins])

  const filteredCheckins = useMemo(() => {
    return checkins.filter((checkin) => !selectedMember || checkin.user.id === selectedMember)
  }, [checkins, selectedMember])

  const stats = useMemo(() => {
    if (filteredCheckins.length === 0) return null

    const totalCheckins = filteredCheckins.length
    const avgEnergyLevel =
      filteredCheckins.reduce((sum, c) => sum + c.energyLevel, 0) / totalCheckins
    const moodDistribution = filteredCheckins.reduce((acc, c) => {
      acc[c.mood] = (acc[c.mood] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const peopleWithBlockers = filteredCheckins.filter(
      (c) => c.blockers && c.blockers.trim()
    ).length

    return {
      totalCheckins,
      avgEnergyLevel,
      avgEnergyLabel: energyLabels[Math.round(avgEnergyLevel)] || "Moderate",
      moodDistribution,
      peopleWithBlockers
    }
  }, [filteredCheckins])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="team" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Team:
            </label>
            <select
              id="team"
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value)
                setSelectedMember("")
              }}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Date:
            </label>
            <input
              type="date"
              id="date"
              value={currentSelectedDate}
              onChange={(e) => handleSelectedDateChange(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="member" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Member:
            </label>
            <select
              id="member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-md px-3 py-2 pr-8 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All members</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Check-ins</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{stats.totalCheckins}</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Battery className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Avg Energy</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
              {stats.avgEnergyLabel}
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {(stats.avgEnergyLevel ?? 0).toFixed(1)} / 5
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Blockers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{stats.peopleWithBlockers}</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Team Mood</span>
            </div>
            <div className="flex gap-1 text-lg">
              {Object.entries(stats.moodDistribution).map(([mood, count]) => (
                <span key={mood} title={`${mood}: ${count}`}>
                  {moodEmojis[mood] || mood}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredCheckins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCheckins.map((checkin) => {
            const canEdit = currentUserId === checkin.user.id
            const energyLevel = Math.min(Math.max(checkin.energyLevel || 0, 1), 5)
            const energyText = energyLabels[energyLevel] || `Level ${energyLevel}`
            const EnergyIcon = energyIconMap[energyLevel] || Battery
            const energyBadgeClass = energyBadgeClasses[energyLevel] || 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300'
            const energyIconClass = energyIconColorClasses[energyLevel] || 'text-gray-500'

            return (
              <div
                key={checkin.id}
                className="relative rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={
                        checkin.user.image?.startsWith("https://lh3.googleusercontent.com/")
                          ? `/api/proxy/image?url=${encodeURIComponent(checkin.user.image)}`
                          : checkin.user.image || "/default-avatar.svg"
                      }
                      alt={checkin.user.name || checkin.user.email}
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.svg"
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate max-w-[200px]">
                        {checkin.user.name || checkin.user.email}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                            moodColors[checkin.mood] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className="text-base">
                            {moodEmojis[checkin.mood] || ""}
                          </span>
                          {checkin.mood.toLowerCase()}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${energyBadgeClass}`}
                        >
                          <EnergyIcon className={`h-3.5 w-3.5 ${energyIconClass}`} />
                          {energyText}
                          <span className="text-[10px] text-gray-500/80 dark:text-gray-300/60">
                            ({energyLevel}/5)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuOpenFor(prev => (prev === checkin.id ? null : checkin.id))
                        }}
                        className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">Open actions</span>
                      </button>

                      {menuOpenFor === checkin.id && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-0 mt-2 w-32 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1 z-20"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFor(null)
                              onEditCheckin?.(checkin)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-gray-200 dark:border-zinc-800 pt-4 space-y-4 text-sm text-gray-700 dark:text-zinc-300">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Today&apos;s Goals</p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                      {checkin.todayGoals || "—"}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Blockers</p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                      {checkin.blockers?.trim() || "—"}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-zinc-400">
                      {checkin.notes?.trim() || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">
            No check-ins for this selection
          </h3>
          <p className="text-gray-600 dark:text-zinc-400">
            No team members have submitted their daily check-ins yet.
          </p>
        </div>
      )}
    </div>
  )
}
