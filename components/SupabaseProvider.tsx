'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { getMyProfile } from '@/lib/db'
import type { DbProfile } from '@/lib/supabase-types'
import type { User, Role } from '@/lib/types'

// Map a Supabase profile to the legacy User shape the store expects.
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
    name:           p.display_name,
    email:          p.username + '@flowroom.app',
    role:           (p.role as Role) || 'מפיק',
    bio:            p.bio,
    location:       p.location,
    avatarColor:    'from-purple-500 to-pink-500',
    initials:       initials || '👤',
    genres:         [],
    trustScore:     85,
    songs:          p.songs_count,
    collabs:        0,
    followers:      p.followers_count,
    rating:         Number(p.rating),
    completionRate: 90,
    portfolio:      [],
    media:          [],
    isOnline:       p.is_online,
    joinedAt:       new Date(p.created_at).toLocaleDateString('he-IL'),
    warnings:       p.warnings,
    isSuspended:    p.is_suspended,
    isVerified:     p.is_verified,
  }
}

/**
 * Keeps the Zustand store in sync with Supabase Auth.
 * If no Supabase env is configured (demo mode), this is a no-op —
 * the existing mock-login flow continues to work.
 */
export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const login = useStore(s => s.login)

  useEffect(() => {
    const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!hasEnv) return // demo mode — skip supabase sync

    let active = true

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (data.session) {
        const profile = await getMyProfile()
        if (profile) {
          // Inject the profile into the legacy store as both currentUser and a users[] entry
          const userShape = profileToUser(profile)
          const store = useStore.getState()
          const existing = store.users.find(u => u.id === userShape.id)
          if (!existing) {
            useStore.setState({ users: [...store.users, userShape] })
          }
          login(userShape.id)
        }
      }
    }

    syncSession()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      if (session) {
        await syncSession()
      }
      // We don't clear currentUser on signout — the app has its own logout flow.
    })

    return () => { active = false; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
