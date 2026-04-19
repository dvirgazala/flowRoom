'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { getMyProfile } from '@/lib/db'
import { profileToUser } from '@/lib/profile-utils'

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!hasEnv) return

    let active = true

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!active || !data.session) return

        const profile = await getMyProfile()
        if (!active || !profile) return

        const userShape = profileToUser(profile)
        const store = useStore.getState()
        const others = store.users.filter(u => u.id !== userShape.id)
        useStore.setState({
          users:       [...others, userShape],
          currentUser: userShape,
        })
      } catch (err) {
        console.error('[SupabaseProvider] sync failed', err)
      }
    }

    syncSession()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session) syncSession()
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  return <>{children}</>
}
