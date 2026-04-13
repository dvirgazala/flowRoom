'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { USERS, STAGES, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import { Plus, Music2, Users, ChevronLeft, Lock, Globe } from 'lucide-react'

export default function RoomsPage() {
  const router = useRouter()
  const { rooms, currentUser, addRoom, showToast } = useStore()
  const user = currentUser || USERS[0]
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const myRooms = rooms.filter(r => r.members.some(m => m.userId === user.id))
  const otherRooms = rooms.filter(r => !r.members.some(m => m.userId === user.id))

  const handleCreate = () => {
    if (!newName.trim()) return
    const newId = addRoom(newName.trim(), newGenre.trim(), newDesc.trim())
    setShowNew(false)
    setNewName('')
    setNewGenre('')
    setNewDesc('')
    router.push(`/rooms/${newId}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">חדרי יצירה</h1>
          <p className="text-text-muted text-sm mt-1">נהל את הפרויקטים המוזיקליים שלך</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
          <Plus size={16} />
          חדר חדש
        </button>
      </div>

      {/* New room modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-bg1 rounded-2xl p-6 w-full max-w-md shadow-surface-lg modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">צור חדר חדש</h2>
            <div className="space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="שם הפרויקט" autoFocus
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple" />
              <input value={newGenre} onChange={e => setNewGenre(e.target.value)}
                placeholder="ז'אנר (פופ, R&B, אלקטרוני...)"
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple" />
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="תיאור קצר (אופציונלי)" rows={3}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-purple" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                צור חדר
              </button>
              <button onClick={() => setShowNew(false)} className="flex-1 py-3 bg-bg3 rounded-xl text-sm text-text-secondary hover:text-text-primary border border-border transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My rooms */}
      {myRooms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">החדרים שלי</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRooms.map(room => {
              const stage = STAGES[room.currentStage]
              const progress = Math.round((room.currentStage / 6) * 100)
              return (
                <Link key={room.id} href={`/rooms/${room.id}`}
                  className="group bg-bg1 rounded-2xl shadow-surface p-5 transition-all duration-200 hover:shadow-glow-sm hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-purple transition-colors">{room.name}</h3>
                      <p className="text-text-muted text-xs mt-0.5">{room.genre}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-success/10 border border-success/20 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-success text-xs font-medium">פעיל</span>
                    </div>
                  </div>

                  {/* Stage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-text-muted">שלב: <span className="text-purple font-medium">{stage.name}</span></span>
                      <span className="text-xs text-text-muted">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2 space-x-reverse">
                      {room.members.slice(0, 4).map(m => {
                        const u = getUserById(m.userId)
                        if (!u) return null
                        return <Avatar key={m.userId} user={u} size="sm" />
                      })}
                      {room.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-bg3 border-2 border-bg1 flex items-center justify-center text-xs text-text-muted">
                          +{room.members.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Users size={13} />
                      <span className="text-xs">{room.members.length}</span>
                      <ChevronLeft size={14} className="group-hover:text-purple transition-colors mr-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Discover rooms */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">חדרים מחפשים חברים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherRooms.map(room => {
            const stage = STAGES[room.currentStage]
            return (
              <div key={room.id} className="bg-bg1 rounded-2xl shadow-surface p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-text-muted text-xs mt-0.5">{room.genre}</p>
                  </div>
                  <Globe size={14} className="text-text-muted mt-1" />
                </div>
                <p className="text-text-secondary text-xs mb-3 line-clamp-2">{room.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">שלב: <span className="text-text-secondary font-medium">{stage.name}</span></span>
                    <span className="text-text-muted">·</span>
                    <span className="text-xs text-text-muted">{room.members.length} חברים</span>
                  </div>
                  <button onClick={() => showToast('בקשת הצטרפות נשלחה!', 'success')}
                    className="px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                    בקש להצטרף
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
