'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { USERS } from '@/lib/data'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import ProfileHoverCard from '@/components/ProfileHoverCard'
import { Search, SlidersHorizontal, Star, Music2, Users, Zap, MapPin, Trophy } from 'lucide-react'

const ROLE_FILTERS = ['הכל', 'מפיק', 'כותב/ת', 'זמר/ת', 'מיקס', 'גיטריסט', 'DJ']
const GENRE_FILTERS = ['הכל', 'פופ', 'R&B', 'אלקטרוני', 'היפהופ', 'מזרחי', 'רוק', 'אינדי']

export default function DiscoverPage() {
  const { currentUser, showToast } = useStore()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('הכל')
  const [genreFilter, setGenreFilter] = useState('הכל')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'trust' | 'online'>('rating')

  const filtered = useMemo(() => {
    let list = USERS.filter(u => u.id !== currentUser?.id)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'הכל') {
      list = list.filter(u => u.role.includes(roleFilter))
    }
    if (genreFilter !== 'הכל') {
      list = list.filter(u => u.genres.some(g => g.includes(genreFilter)))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'followers') return b.followers - a.followers
      if (sortBy === 'trust') return b.trustScore - a.trustScore
      if (sortBy === 'online') return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0)
      return b.rating - a.rating
    })
  }, [search, roleFilter, genreFilter, sortBy, currentUser])

  const onlineCount = USERS.filter(u => u.isOnline).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">גלה יוצרים</h1>
        <p className="text-text-muted text-sm mt-1">מצא שותפים מושלמים לפרויקט הבא שלך</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-success text-xs font-medium">{onlineCount} מחוברים עכשיו</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-4 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="חפש לפי שם, תפקיד, סגנון..."
              className="w-full bg-bg3 border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/50 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-bg3 border border-border rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-purple cursor-pointer"
          >
            <option value="rating">דירוג</option>
            <option value="followers">עוקבים</option>
            <option value="trust">אמינות</option>
            <option value="online">אונליין עכשיו</option>
          </select>
          <button onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all
              ${showFilters
                ? 'bg-purple/15 border-purple/40 text-purple'
                : 'bg-bg3 border-border text-text-secondary hover:text-text-primary hover:border-purple/40'}`}>
            <SlidersHorizontal size={15} />
            פילטרים
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 pt-3 border-t border-border">
            {/* Role filter */}
            <div>
              <p className="text-xs text-text-muted mb-2">תפקיד</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_FILTERS.map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${roleFilter === r
                        ? 'bg-purple/20 border-purple/40 text-purple'
                        : 'bg-bg3 border-border text-text-secondary hover:text-text-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {/* Genre filter */}
            <div>
              <p className="text-xs text-text-muted mb-2">ז'אנר</p>
              <div className="flex flex-wrap gap-2">
                {GENRE_FILTERS.map(g => (
                  <button key={g} onClick={() => setGenreFilter(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${genreFilter === g
                        ? 'bg-pink/20 border-pink/40 text-pink'
                        : 'bg-bg3 border-border text-text-secondary hover:text-text-primary'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-text-muted text-xs mb-4">{filtered.length} יוצרים נמצאו</p>

      {/* User grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div key={u.id} className="bg-bg1 rounded-2xl shadow-surface p-5 hover:shadow-glow-sm transition-all group">
            {/* Top row */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar user={u} size="lg" showOnline />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ProfileHoverCard userId={u.id}>
                    <Link href={`/profile/${u.id}`}
                      className="font-semibold text-sm hover:text-purple transition-colors group-hover:text-purple">
                      {u.name}
                    </Link>
                  </ProfileHoverCard>
                  {u.isVerified && <VerifiedBadge size={13} />}
                </div>
                <p className="text-text-muted text-xs mt-0.5">{u.role}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} className="text-text-muted" />
                  <span className="text-text-muted text-xs">{u.location}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-3">{u.bio}</p>

            {/* Genres */}
            {u.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {u.genres.slice(0, 3).map(g => (
                  <span key={g} className="text-xs px-2 py-0.5 bg-purple/10 border border-purple/20 text-purple rounded-md">{g}</span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4 pt-3 border-t border-border">
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  <Music2 size={11} className="text-purple" />
                  <span className="text-sm font-bold">{u.songs}</span>
                </div>
                <p className="text-text-muted text-xs">שירים</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  <Star size={11} className="text-warning" />
                  <span className="text-sm font-bold">{u.rating.toFixed(1)}</span>
                </div>
                <p className="text-text-muted text-xs">דירוג</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-0.5">
                  <Trophy size={11} className="text-success" />
                  <span className="text-sm font-bold">{u.trustScore}</span>
                </div>
                <p className="text-text-muted text-xs">אמון</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => showToast(`בקשת שיתוף פעולה נשלחה ל${u.name}!`, 'success')}
                className="flex-1 py-2 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm flex items-center justify-center gap-1.5">
                <Zap size={11} />
                שתף פעולה
              </button>
              <Link href={`/profile/${u.id}`}
                className="flex-1 py-2 rounded-xl text-xs text-center text-text-secondary hover:text-text-primary hover:border-purple/40 transition-colors flex items-center justify-center gap-1.5 bg-bg3 border border-border">
                <Users size={11} />
                פרופיל
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">לא נמצאו יוצרים</p>
          <button onClick={() => { setSearch(''); setRoleFilter('הכל'); setGenreFilter('הכל') }}
            className="mt-3 text-purple text-sm hover:underline">נקה חיפוש</button>
        </div>
      )}
    </div>
  )
}
