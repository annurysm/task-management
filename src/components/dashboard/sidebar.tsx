'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  X, 
  LayoutDashboard, 
  Kanban, 
  Target, 
  Users, 
  Building, 
  Tag,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Tasks', href: '/dashboard/kanban', icon: Kanban },
  { name: 'Weekly Focus', href: '/dashboard/weekly-planning', icon: Calendar },
  { name: 'Daily Check-in', href: '/dashboard/daily-checkin', icon: CheckCircle },
  { name: 'OKR', href: '/dashboard/objectives', icon: Target },
  { name: 'Teams', href: '/dashboard/teams', icon: Users },
  { name: 'Organization', href: '/dashboard/organization', icon: Building },
  { name: 'Labels', href: '/dashboard/labels', icon: Tag },
  { name: 'Epics', href: '/dashboard/epics', icon: BookOpen },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-zinc-900 px-6 pb-4 transition-colors">
      <div className="flex h-16 shrink-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Ceklis</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? 'bg-gray-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'text-gray-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-zinc-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        pathname === item.href 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-gray-400 dark:text-zinc-500 group-hover:text-orange-600 dark:group-hover:text-orange-400',
                        'h-6 w-6 shrink-0 transition-colors'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80 dark:bg-black/80" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white dark:bg-zinc-900 transition-colors">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                className="rounded-md p-2 text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  )
}
