'use client'

import { EpicsDashboard } from '@/components/epics/epics-dashboard'

export default function EpicsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Epic Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage strategic initiatives and track progress across teams
        </p>
      </div>
      <EpicsDashboard />
    </div>
  )
}