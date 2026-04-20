'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STAGES } from '@/lib/data'
import { getMyRooms, getActiveRooms, createRoom, joinRoom } from '@/lib/db'
import type { DbRoom } from '@/lib/supabase-types'
import Avatar from '@/components/Avatar'
import { profileToUser } from '@/lib/profile-utils'
import { Plus, Users, ChevronLeft, Globe, Loader2, Music2 } from 'lucide-react'

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RoomsPage() {
  const router = useRouter()
  const { currentUser, showToast } = useStore()
  const user = currentUser

  const [myRooms, setMyRooms]       = useState<DbRoom[]>([])
  const [allRooms, setAllRooms]     = useState<DbRoom[]>([])
  const [loading, setLoading]       = useState(hasSupabase)
  const [joining, setJoining]       = useState<string | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState('')
  const [newGenre, setNewGenre]     = useState('')
  const [newDesc, setNewDesc]       = useState('')

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return }
    Promise.all([getMyRooms(), getActiveRooms()])
      .then(([mine, all]) => {
        setMyRooms(mine)
        setAllRooms(all)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const myRoomIds = new Set(myRooms.map(r => r.id))
  const otherRooms = allRooms.filter(r => !myRoomIds.has(r.id))

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const { data, error } = await createRoom({ name: newName.trim(), genre: newGenre.trim() || undefined, description: newDesc.trim() || undefined })
    setCreating(false)
    if (error || !data) { showToast('שגיאה ביצירת החדר', 'error'); return }
    setShowNew(false); setNewName(''); setNewGenre(''); setNewDesc('')
    showToast('החדר נוצר!', 'success')
    router.push(`/rooms/${data.id}`)
  }

  const handleJoin = async (room: DbRoom) => {
    setJoining(room.id)
    const { error } = await joinRoom(room.id)
    setJoining(null)
    if (error) { showToast('שגיאה בהצטרפות', 'error'); return }
    setMyRooms(prev => [...prev, room])
    showToast(`הצטרפת ל-${room.name}!`, 'success')
    router.push(`/rooms/${room.id}`)
  }

  const stageProgress = (room: DbRoom) => Math.round((room.current_stage / 6) * 100)
  const stageName = (room: DbRoom) => STAGES[room.current_stage]?.name ?? 'רעיון'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">חדרי יצירה</h1>
          <p className="text-text-muted text-sm mt-1">סטודיו וירטואלי לשיתוף פעולה מוזיקלי</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
          <Plus size={16} />חדר חדש
        </button>
      </div>

      {/* Create modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-bg1 rounded-2xl p-6 w-full max-w-md shadow-surface-lg modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">חדר יצירה חדש</h2>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="שם הפרויקט *" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple" />
              <input value={newGenre} onChange={e => setNewGenre(e.target.value)}
                placeholder="ז'אנר (פופ, R&B, אלקטרוני...)"
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="תיאור קצר (אופציונלי)" rows={3}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-purple" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} disabled={!newName.trim() || creating}
                className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={14} className="animate-spin" />יוצר...</> : 'צור חדר'}
              </button>
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-3 bg-bg3 rounded-xl text-sm text-text-secondary hover:text-text-primary border border-border transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-purple" /></div>
      ) : (
        <>
          {/* My rooms */}
          {myRooms.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">החדרים שלי</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRooms.map(room => (
                  <Link key={room.id} href={`/rooms/${room.id}`}
                    className="group bg-bg1 rounded-2xl shadow-surface p-5 hover:shadow-glow-sm hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-purple transition-colors">{room.name}</h3>
                        <p className="text-text-muted text-xs mt-0.5">{room.genre}</p>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-1 bg-success/10 border border-success/20 rounded-lg text-xs text-success font-medium flex-shrink-0 mr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />פעיל
                      </span>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5 text-xs text-text-muted">
                        <span>שלב: <span className="text-purple font-medium">{stageName(room)}</span></span>
                        <span>{stageProgress(room)}%</span>
                      </div>
                      <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${stageProgress(room)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-text-muted">
                        <Music2 size={13} />
                        <span className="text-xs">{room.genre || 'כללי'}</span>
                      </div>
                      <ChevronLeft size={14} className="text-text-muted group-hover:text-purple transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discover */}
          {otherRooms.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">חדרים מחפשים חברים</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherRooms.map(room => (
                  <div key={room.id} className="bg-bg1 rounded-2xl shadow-surface p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{room.name}</h3>
                        <p className="text-text-muted text-xs mt-0.5">{room.genre}</p>
                      </div>
                      <Globe size={14} className="text-text-muted mt-1 flex-shrink-0 mr-2" />
                    </div>
                    {room.description && (
                      <p className="text-text-secondary text-xs mb-3 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-text-muted">שלב: <span className="text-text-secondary font-medium">{stageName(room)}</span></span>
                      <div className="flex gap-2">
                        <Link href={`/rooms/${room.id}`}
                          className="px-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors">
                          צפה
                        </Link>
                        <button onClick={() => handleJoin(room)} disabled={joining === room.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                          {joining === room.id ? <Loader2 size={11} className="animate-spin" /> : null}
                          הצטרף
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myRooms.length === 0 && otherRooms.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music2 size={28} className="text-purple" />
              </div>
              <h3 className="font-semibold mb-2">אין חדרים עדיין</h3>
              <p className="text-text-muted text-sm mb-4">צור את החדר הראשון שלך ותתחיל לשתף פעולה</p>
              <button onClick={() => setShowNew(true)}
                className="px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
                צור חדר ראשון
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
