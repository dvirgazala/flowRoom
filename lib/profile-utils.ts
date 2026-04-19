import type { DbProfile } from './supabase-types'
import type { User, Role } from './types'

export function profileToUser(p: DbProfile): User {
  const initials = p.display_name
    .split(/\s+/)
    .map(w => w[0])
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
    avatarUrl:      p.avatar_url ?? undefined,
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

export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דקות`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  const days = Math.floor(hours / 24)
  if (days < 7) return `לפני ${days} ימים`
  return new Date(isoString).toLocaleDateString('he-IL')
}
