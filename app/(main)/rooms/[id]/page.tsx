'use client'
import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STAGES } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import { profileToUser } from '@/lib/profile-utils'
import * as db from '@/lib/db'
import { uploadFile } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import type { DbRoom, DbRoomMember, DbProfile, DbRoomMessage, DbRoomStem, DbRoomTask } from '@/lib/supabase-types'
import {
  ArrowLeft, CheckSquare, Square, Upload, Music2,
  MessageCircle, Send, Users, FileMusic, Zap, ChevronRight,
  Loader2, Trash2, UserPlus, X, Search,
} from 'lucide-react'

type Member = DbRoomMember & { profile: DbProfile }
type Message = DbRoomMessage & { author: DbProfile }
type Task = DbRoomTask & { stage: number }

const TABS = [
  { id: 'chat',  label: "צ'אט",   icon: MessageCircle },
  { id: 'files', label: 'קבצים',  icon: FileMusic },
  { id: 'tasks', label: 'משימות', icon: Zap },
] as const

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { currentUser, showToast } = useStore()

  const [room,     setRoom]     = useState<DbRoom | null>(null)
  const [members,  setMembers]  = useState<Member[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [stems,    setStems]    = useState<DbRoomStem[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'tasks'>('chat')
  const [chatText, setChatText] = useState('')
  const [sending,  setSending]  = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteQ,    setInviteQ]    = useState('')
  const [inviteRes,  setInviteRes]  = useState<DbProfile[]>([])
  const [inviting,   setInviting]   = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      db.getRoomById(id),
      db.getRoomMembers(id),
      db.getRoomMessages(id),
      db.getRoomStems(id),
      db.getRoomTasks(id),
    ]).then(([r, m, msgs, s, t]) => {
      if (!r) { router.push('/rooms'); return }
      setRoom(r)
      setMembers(m)
      setMessages(msgs)
      setStems(s)
      setTasks(t as Task[])
    }).finally(() => setLoading(false))
  }, [id, router])

  // Realtime chat subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room_msg_${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${id}` },
        async (payload) => {
          const msg = payload.new as DbRoomMessage
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', msg.user_id).single()
          if (profile) {
            setMessages(prev => [...prev, { ...msg, author: profile as DbProfile }])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendChat = async () => {
    if (!chatText.trim() || sending) return
    setSending(true)
    await db.sendRoomMessage(id, chatText.trim())
    setChatText('')
    setSending(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `rooms/${id}/${Date.now()}.${ext}`
      const url = await uploadFile('post-media', path, file)
      if (!url) throw new Error('upload failed')
      const sizeKB = Math.round(file.size / 1024)
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
      await db.addRoomStem(id, file.name, url, sizeStr)
      const newStems = await db.getRoomStems(id)
      setStems(newStems)
      showToast(`"${file.name}" הועלה בהצלחה`, 'success')
    } catch {
      showToast('שגיאה בהעלאת הקובץ', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteStem = async (stemId: string) => {
    await db.deleteRoomStem(stemId)
    setStems(prev => prev.filter(s => s.id !== stemId))
    showToast('הקובץ נמחק', 'success')
  }

  const handleToggleTask = async (taskId: string, done: boolean) => {
    await db.toggleRoomTask(taskId, done)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done } : t))
  }

  const handleInviteSearch = (q: string) => {
    setInviteQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setInviteRes([]); return }
    searchTimer.current = setTimeout(async () => {
      const results = await db.searchProfiles(q.trim(), 8)
      const memberIds = new Set(members.map(m => m.user_id))
      setInviteRes(results.filter(p => !memberIds.has(p.id)))
    }, 300)
  }

  const handleInvite = async (profile: DbProfile) => {
    if (!room) return
    setInviting(profile.id)
    const { error } = await db.inviteToRoom(room.id, profile.id)
    setInviting(null)
    if (error?.message === 'already member') {
      showToast(`${profile.display_name} כבר חבר בחדר`, 'error')
    } else if (error) {
      showToast('שגיאה בשליחת ההזמנה', 'error')
    } else {
      showToast(`הזמנה נשלחה ל-${profile.display_name}`, 'success')
      setInviteRes(prev => prev.filter(p => p.id !== profile.id))
    }
  }

  const handleAdvanceStage = async () => {
    if (!room) return
    await db.advanceRoomStage(id, room.current_stage)
    setRoom(prev => prev ? { ...prev, current_stage: prev.current_stage + 1 } : prev)
    showToast('מעבר לשלב הבא!', 'success')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-purple" />
      </div>
    )
  }

  if (!room) return null

  const stage = STAGES[room.current_stage] ?? STAGES[0]

  const InviteModal = showInvite ? (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => { setShowInvite(false); setInviteQ(''); setInviteRes([]) }}>
      <div className="bg-bg1 rounded-2xl p-6 w-full max-w-sm shadow-surface-lg"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">הזמן שותף לחדר</h2>
          <button onClick={() => { setShowInvite(false); setInviteQ(''); setInviteRes([]) }}
            className="p-1.5 rounded-full hover:bg-bg3 text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            autoFocus
            value={inviteQ}
            onChange={e => handleInviteSearch(e.target.value)}
            placeholder="חפש לפי שם משתמש..."
            className="w-full bg-bg3 border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple"
          />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {inviteRes.length === 0 && inviteQ.trim() && (
            <p className="text-text-muted text-xs text-center py-4">לא נמצאו משתמשים</p>
          )}
          {inviteRes.map(profile => (
            <div key={profile.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg3 transition-colors">
              <Avatar user={profileToUser(profile)} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.display_name}</p>
                <p className="text-xs text-text-muted">@{profile.username}</p>
              </div>
              <button onClick={() => handleInvite(profile)} disabled={inviting === profile.id}
                className="flex-shrink-0 px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {inviting === profile.id ? <Loader2 size={11} className="animate-spin" /> : 'הזמן'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null
  const currentTasks = tasks.filter(t => t.stage === room.current_stage)
  const doneTasks = currentTasks.filter(t => t.done).length
  const isCreator = room.created_by === currentUser?.id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {InviteModal}
      {/* Back */}
      <Link href="/rooms" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />חזרה לחדרים
      </Link>

      {/* Header */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-6 mb-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            {room.description && <p className="text-text-secondary text-sm mt-1">{room.description}</p>}
            {room.genre && (
              <span className="inline-block text-xs text-purple mt-1.5 bg-purple/10 px-2.5 py-1 rounded-lg">{room.genre}</span>
            )}
          </div>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-purple hover:border-purple/40 transition-all">
            <UserPlus size={15} />הזמן
          </button>
          <Link href={`/rooms/${id}/flow`}
            className="px-4 py-2 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
            ניהול Flow
          </Link>
        </div>

        {/* Stage progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">שלב נוכחי: <span className="text-purple">{stage.name}</span></span>
            <span className="text-xs text-text-muted">{doneTasks}/{currentTasks.length} משימות</span>
          </div>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <div key={s.id} title={s.name}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  i < room.current_stage ? 'bg-success' : i === room.current_stage ? 'bg-purple' : 'bg-bg3'
                }`} />
            ))}
          </div>
        </div>

        {/* Members row */}
        {members.length > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <div className="flex -space-x-2 space-x-reverse">
              {members.slice(0, 6).map(m => (
                <Avatar key={m.user_id} user={profileToUser(m.profile)} size="sm" />
              ))}
            </div>
            <span className="text-xs text-text-muted">{members.length} חברים</span>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tasks sidebar */}
        <div className="bg-bg1 rounded-2xl shadow-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-purple" />
              <h2 className="font-semibold text-sm">משימות שלב</h2>
            </div>
            <span className="text-xs text-text-muted bg-bg3 px-2 py-0.5 rounded-lg">{doneTasks}/{currentTasks.length}</span>
          </div>

          <div className="space-y-2">
            {currentTasks.map(task => (
              <div key={task.id}
                className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all hover:bg-bg2 ${task.done ? 'opacity-70' : ''}`}
                onClick={() => handleToggleTask(task.id, !task.done)}>
                {task.done
                  ? <CheckSquare size={16} className="text-success flex-shrink-0 mt-0.5" />
                  : <Square size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
                }
                <p className={`text-xs leading-snug ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {task.title}
                </p>
              </div>
            ))}
          </div>

          {currentTasks.length === 0 && (
            <p className="text-text-muted text-xs text-center py-4">אין משימות לשלב זה</p>
          )}

          {doneTasks === currentTasks.length && currentTasks.length > 0 && room.current_stage < STAGES.length - 1 && (
            <button onClick={handleAdvanceStage}
              className="w-full mt-4 py-2.5 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-1.5">
              <ChevronRight size={14} />עבור לשלב הבא
            </button>
          )}
        </div>

        {/* Tab panel */}
        <div className="lg:col-span-2 bg-bg1 rounded-2xl shadow-surface overflow-hidden flex flex-col" style={{ height: 520 }}>
          {/* Tab bar */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button key={tid} onClick={() => setActiveTab(tid)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all flex-1 justify-center ${
                  activeTab === tid ? 'text-purple' : 'text-text-muted hover:text-text-secondary hover:bg-bg2/30'
                }`}
                style={{ borderBottom: activeTab === tid ? '2px solid #a855f7' : '2px solid transparent' }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Chat */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-text-muted text-sm py-8">עדיין אין הודעות. התחל שיחה!</p>
                )}
                {messages.map(msg => {
                  const isMe = msg.user_id === currentUser?.id
                  const u = profileToUser(msg.author)
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar user={u} size="sm" />
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${
                        isMe ? 'bg-purple/20 rounded-bl-md' : 'bg-bg3 rounded-br-md'
                      }`}>
                        {!isMe && <p className="text-xs font-semibold text-purple mb-1">{msg.author.display_name}</p>}
                        <p className="text-text-primary leading-snug">{msg.text}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="הקלד הודעה..."
                  className="flex-1 bg-bg3 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-purple/50 transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                />
                <button onClick={sendChat} disabled={!chatText.trim() || sending}
                  className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-glow-sm flex-shrink-0">
                  {sending
                    ? <Loader2 size={14} className="text-white animate-spin" />
                    : <Send size={14} className="text-white" />
                  }
                </button>
              </div>
            </>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">{stems.length} קבצים</p>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity shadow-glow-sm">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  העלה קובץ
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>

              {stems.length === 0 ? (
                <div className="text-center py-8">
                  <Music2 size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">אין קבצים עדיין</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stems.map(stem => (
                    <div key={stem.id} className="p-3 bg-bg2 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileMusic size={14} className="text-purple flex-shrink-0" />
                          <span className="text-xs font-medium text-text-primary truncate">{stem.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-text-muted">{stem.file_size}</span>
                          {(stem.uploaded_by === currentUser?.id || isCreator) && (
                            <button onClick={() => handleDeleteStem(stem.id)}
                              className="p-1 rounded text-text-muted hover:text-danger transition-colors">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <AudioPlayer url={stem.audio_url} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All tasks overview */}
          {activeTab === 'tasks' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {STAGES.map((s, stageIdx) => {
                const stageTasks = tasks.filter(t => t.stage === stageIdx)
                const stageDone = stageTasks.filter(t => t.done).length
                const isCurrent = stageIdx === room.current_stage
                return (
                  <div key={s.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${isCurrent ? 'text-purple' : 'text-text-muted'}`}>{s.name}</span>
                      <span className="text-xs text-text-muted">({stageDone}/{stageTasks.length})</span>
                      {stageIdx < room.current_stage && <span className="text-success text-xs">✓</span>}
                      {isCurrent && <span className="text-xs bg-purple/15 text-purple px-1.5 py-0.5 rounded-md">נוכחי</span>}
                    </div>
                    <div className="space-y-1 mr-1">
                      {stageTasks.map(task => (
                        <div key={task.id}
                          className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-bg2 transition-colors ${task.done ? 'opacity-60' : ''}`}
                          onClick={() => handleToggleTask(task.id, !task.done)}>
                          {task.done
                            ? <CheckSquare size={14} className="text-success flex-shrink-0 mt-0.5" />
                            : <Square size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
                          }
                          <p className={`text-xs ${task.done ? 'line-through text-text-muted' : ''}`}>{task.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Members card */}
      {members.length > 0 && (
        <div className="bg-bg1 rounded-2xl shadow-surface p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-purple" />
            <h2 className="font-semibold text-sm">חברי הצוות</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {members.map(m => {
              const u = profileToUser(m.profile)
              return (
                <Link key={m.user_id} href={`/profile/${m.profile.username}`}
                  className="flex flex-col items-center gap-2 p-3 bg-bg2 rounded-xl hover:bg-bg3 transition-colors group text-center">
                  <Avatar user={u} size="md" />
                  <div>
                    <p className="text-xs font-medium group-hover:text-purple transition-colors">{m.profile.display_name}</p>
                    <p className="text-text-muted text-xs">{m.role}</p>
                    <p className="text-purple text-xs font-bold">{m.split}%</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
