'use client'

import { useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-4 w-4 text-gray-600 dark:text-zinc-300" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-2 z-20">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    theme === themeOption.value
                      ? 'bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {themeOption.label}
                  {theme === themeOption.value && (
                    <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full ml-auto" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}