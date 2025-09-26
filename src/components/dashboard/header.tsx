'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Bell, Search, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ConnectionStatus } from '@/components/ui/connection-status'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session, status } = useSession()
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false)
  const [imageLoadAttempted, setImageLoadAttempted] = React.useState(false)

  // Enhanced debugging
  React.useEffect(() => {
    console.log('🔍 Header component - Session data changed:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasImage: !!session?.user?.image,
      imageUrl: session?.user?.image,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
      imageLoadFailed,
      imageLoadAttempted
    })

    // Test if image URL is accessible via proxy
    if (session?.user?.image) {
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(session.user.image)}`
      console.log('🧪 Testing image URL accessibility via proxy:', proxyUrl)
      
      // Create a test image to check if proxy URL loads
      const testImg = new Image()
      testImg.onload = () => {
        console.log('✅ Test image loaded successfully via proxy!', {
          originalUrl: session.user.image,
          proxyUrl: proxyUrl,
          width: testImg.naturalWidth,
          height: testImg.naturalHeight
        })
      }
      testImg.onerror = (e) => {
        console.error('❌ Test image failed to load via proxy!', {
          originalUrl: session.user.image,
          proxyUrl: proxyUrl,
          error: e
        })
      }
      testImg.src = proxyUrl
    }
  }, [session, status, imageLoadFailed, imageLoadAttempted])

  // Reset image load state when session image changes
  React.useEffect(() => {
    if (session?.user?.image) {
      setImageLoadFailed(false)
      setImageLoadAttempted(false)
    }
  }, [session?.user?.image])

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-zinc-300 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 lg:hidden" />

      <div className="flex flex-1 justify-end items-center gap-x-6">
        <div className="relative flex max-w-xs items-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            className="block w-full rounded-md border-0 bg-white dark:bg-zinc-800 py-1 pl-9 pr-3 text-gray-900 dark:text-zinc-100 ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:focus:ring-orange-500 text-sm leading-5 transition-colors h-9"
            placeholder="Search tasks, epics, or team members..."
            type="search"
          />
        </div>
        <div className="flex items-center gap-x-3 lg:gap-x-4">
          <ConnectionStatus />
          
          <ThemeToggle />
          
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-zinc-500 dark:hover:text-zinc-400"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-zinc-700" />

          <div className="flex items-center gap-x-2 lg:gap-x-3">
            {session?.user?.image && !imageLoadFailed ? (
              <img
                className="h-8 w-8 rounded-full bg-gray-50 dark:bg-zinc-600 object-cover"
                src={`/api/proxy/image?url=${encodeURIComponent(session.user.image)}`}
                alt={session?.user?.name || ''}
                onLoad={(e) => {
                  console.log('✅ Profile image loaded successfully via proxy!', {
                    originalUrl: session.user.image,
                    proxyUrl: e.currentTarget.src,
                    naturalWidth: e.currentTarget.naturalWidth,
                    naturalHeight: e.currentTarget.naturalHeight,
                    complete: e.currentTarget.complete
                  })
                  setImageLoadAttempted(true)
                }}
                onError={(e) => {
                  console.error('❌ Profile image failed to load via proxy!', {
                    originalUrl: session.user.image,
                    proxyUrl: e.currentTarget.src,
                    naturalWidth: e.currentTarget.naturalWidth,
                    naturalHeight: e.currentTarget.naturalHeight,
                    complete: e.currentTarget.complete
                  })
                  
                  // Only set as failed if we haven't already attempted and this is a real failure
                  if (!imageLoadAttempted) {
                    setTimeout(() => {
                      console.log('🔄 Setting image as failed after delay')
                      setImageLoadFailed(true)
                    }, 100) // Small delay to prevent race condition
                  }
                }}
                loading="eager"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className="hidden text-sm font-semibold leading-6 text-gray-900 dark:text-zinc-100 lg:block">
              {session?.user?.name}
            </span>
            <button
              onClick={async () => {
                try {
                  console.log('Attempting to sign out...')
                  await signOut({ callbackUrl: '/', redirect: true })
                } catch (error) {
                  console.error('Sign out error:', error)
                }
              }}
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-zinc-500 dark:hover:text-zinc-400"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}