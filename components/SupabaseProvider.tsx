'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { getMyProfile } from '@/lib/db'
import type { DbProfile } from '@/lib/supabase-types'
import type { User, Role } from '@/lib/types'

function profileToUser(p: DbProfile): User {
  const initials = p.display_name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return {
    id:             p.id,
    name:           p.display_name || 'משתמש',
    email:          p.username + '@flowroom.app',
    role:           (p.role as Role) || 'מפיק',
    bio:            p.bio || '',
    location:       p.location || '',
    avatarColor:    'from-purple-500 to-pink-500',
    initials:       initials || '👤',
    genres:         [],
    trustScore:     85,
    songs:          p.songs_count || 0,
    collabs:        0,
    followers:      p.followers_count || 0,
    rating:         Number(p.rating) || 0,
    completionRate: 90,
    portfolio:      [],
    media:          [],
    isOnline:       p.is_online || false,
    joinedAt:       new Date(p.created_at).toLocaleDateString('he-IL'),
    warnings:       p.warnings || 0,
    isSuspended:    p.is_suspended || false,
    isVerified:     p.is_verified || false,
  }
}

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
