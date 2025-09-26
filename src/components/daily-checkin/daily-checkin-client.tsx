'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DailyCheckinForm } from './daily-checkin-form'
import { TeamCheckinDashboard } from './team-checkin-dashboard'
import type { DailyCheckin } from './team-checkin-dashboard'

const formatDateToJakarta = (value: string | Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value)

const getJakartaDateString = () => formatDateToJakarta(new Date())

export function DailyCheckinClient() {
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getJakartaDateString)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [checkinToEdit, setCheckinToEdit] = useState<DailyCheckin | null>(null)

  const handleCheckinSubmit = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCloseForm = () => {
    setShowCheckinForm(false)
    setCheckinToEdit(null)
    setFormMode('create')
  }

  const openCreateForm = () => {
    setCheckinToEdit(null)
    setFormMode('create')
    setSelectedDate(getJakartaDateString())
    setShowCheckinForm(true)
  }

  const handleEditCheckin = (checkin: DailyCheckin) => {
    setCheckinToEdit(checkin)
    setFormMode('edit')
    const normalizedDate = formatDateToJakarta(checkin.date)
    setSelectedDate(normalizedDate)
    setShowCheckinForm(true)
  }

  const editInitialValues = checkinToEdit
    ? {
        teamId: checkinToEdit.team?.id ?? '',
        date: checkinToEdit.date,
        todayGoals: checkinToEdit.todayGoals,
        blockers: checkinToEdit.blockers,
        mood: checkinToEdit.mood,
        energyLevel: checkinToEdit.energyLevel,
        notes: checkinToEdit.notes,
      }
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Daily Check-ins</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Submit your daily check-in and view team updates
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Submit Check-in
        </button>
      </div>

      {/* Team Check-in Dashboard */}
      <TeamCheckinDashboard
        refreshToken={refreshKey}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        onEditCheckin={handleEditCheckin}
      />

      {/* Daily Check-in Form Modal */}
      {showCheckinForm && (
        <DailyCheckinForm
          onClose={handleCloseForm}
          onSubmit={handleCheckinSubmit}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          mode={formMode}
          checkinId={checkinToEdit?.id}
          initialValues={editInitialValues}
        />
      )}
    </div>
  )
}
