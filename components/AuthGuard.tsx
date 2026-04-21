'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { getMyProfile, getSession } from '@/lib/db'
import { profileToUser } from '@/lib/profile-utils'
import { Music2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentUser = useStore(s => s.currentUser)
  const setCurrentUser = useStore(s => s.setCurrentUser)
  const hasHydrated = useStore(s => s._hasHydrated)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    ;(async () => {
      const session = await getSession()
      if (!session) {
        // No Supabase session — clear stale store user and redirect
        if (currentUser) useStore.setState({ currentUser: null })
        router.replace('/login')
        setChecking(false)
        return
      }
      // Session exists — make sure store has the real Supabase profile
      if (!currentUser || currentUser.id !== session.user.id) {
        const profile = await getMyProfile()
        if (profile) setCurrentUser(profileToUser(profile))
      }
      setChecking(false)
    })()
  }, [hasHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || checking) {
    return (
      <div className="min-h-screen bg-bg0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-sm animate-pulse">
            <Music2 size={22} className="text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-purple/30 border-t-purple rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!currentUser) return null

  return <>{children}</>
}
