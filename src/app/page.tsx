import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignInButton } from '@/components/auth/sign-in-button'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Ceklis</h1>
          <p className="mt-2 text-gray-600">
            Kanban board and task management tool for product design teams
          </p>
        </div>
        <div className="space-y-4">
          <SignInButton />
          <p className="text-sm text-gray-500">
            Sign in with Google to get started
          </p>
        </div>
      </div>
    </div>
  )
}
