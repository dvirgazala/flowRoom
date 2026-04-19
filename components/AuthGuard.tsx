'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Music2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentUser = useStore(s => s.currentUser)
  const hasHydrated = useStore(s => s._hasHydrated)

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.replace('/login')
    }
  }, [hasHydrated, currentUser, router])

  // Waiting for localStorage to hydrate — show branded spinner
  if (!hasHydrated) {
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

  // Hydrated but no user — redirect is in flight, render nothing
  if (!currentUser) return null

  return <>{children}</>
}
