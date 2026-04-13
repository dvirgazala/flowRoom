'use client'
import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { STAGES, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import {
  ArrowLeft, CheckSquare, Square, Upload, Music2, Clock,
  MessageCircle, Send, Users, FileMusic, Zap, CheckCheck, ChevronRight
} from 'lucide-react'

const TABS = [
  { id: 'chat', label: 'צ\'אט', icon: MessageCircle },
  { id: 'files', label: 'קבצים', icon: FileMusic },
  { id: 'activity', label: 'פעילות', icon: Clock },
]

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { rooms, currentUser, updateTaskDone, addStem, advanceStage, addChatMessage, showToast } = useStore()
  const room = rooms.find(r => r.id === id)
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'activity'>('chat')
  const [chatText, setChatText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.chatMessages?.length])

  if (!room) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-text-muted">החדר לא נמצא</p>
        <Link href="/rooms" className="text-purple text-sm hover:underline mt-2 inline-block">חזרה לחדרים</Link>
      </div>
    )
  }

  const user = currentUser || { id: 'u1', name: 'משתמש' }
  const stage = STAGES[room.currentStage] ?? STAGES[0]
  const allTasks = room.tasks ?? []
  const allStems = room.stems ?? []
  const allActivity = room.activity ?? []
  const allMessages = room.chatMessages ?? []
  const currentTasks = allTasks.filter(t => t.stage === room.currentStage)
  const doneTasks = currentTasks.filter(t => t.done).length
  const progress = Math.round((room.currentStage / (STAGES.length - 1)) * 100)

  const sendChat = () => {
    if (!chatText.trim()) return
    addChatMessage(room.id, chatText.trim())
    setChatText('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addStem(room.id, file.name, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')
    showToast(`"${file.name}" הועלה בהצלחה 🎵`, 'success')
    e.target.value = ''
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/rooms" className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        חזרה לחדרים
      </Link>

      {/* Header */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-6 mb-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-text-secondary text-sm mt-1">{room.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/rooms/${id}/splits`}
              className="px-4 py-2 bg-bg3 rounded-xl text-sm text-text-secondary hover:text-purple hover:bg-bg2 active:scale-95 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              Splits
            </Link>
            <Link href={`/rooms/${id}/flow`}
              className="px-4 py-2 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
              ניהול Flow
            </Link>
          </div>
        </div>

        {/* Stage progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">שלב נוכחי: <span className="text-purple">{stage.name}</span></span>
            <span className="text-xs text-text-muted">{doneTasks}/{currentTasks.length} משימות · {progress}%</span>
          </div>
          <div className="flex gap-1 mb-1">
            {STAGES.map((s, i) => (
              <div key={s.id} title={s.name} className={`flex-1 h-2 rounded-full transition-all duration-300
                ${i < room.currentStage ? 'bg-success' : i === room.currentStage ? 'bg-brand-gradient' : 'bg-bg3'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            {STAGES.map((s, i) => (
              <span key={s.id}
                className={`text-xs truncate text-center ${i === room.currentStage ? 'text-purple font-medium' : 'text-text-muted'}`}
                style={{ width: `${100 / STAGES.length}%` }}>
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Members row */}
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex -space-x-2 space-x-reverse">
            {room.members.map(m => {
              const u = getUserById(m.userId)
              if (!u) return null
              return <Avatar key={m.userId} user={u} size="sm" showOnline />
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
            {room.members.map(m => {
              const u = getUserById(m.userId)
              if (!u) return null
              return (
                <span key={m.userId} className="flex items-center gap-1">
                  {u.name}
                  <span className="text-text-muted/60">({m.role}, {m.split}%)</span>
                  {m.hasSigned && <CheckCheck size={11} className="text-success" />}
                </span>
              )
            })}
          </div>
        </div>
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
            {currentTasks.map(task => {
              const assignee = getUserById(task.assignedTo)
              return (
                <div key={task.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all hover:bg-bg2 ${task.done ? 'opacity-70' : ''}`}
                  onClick={() => updateTaskDone(room.id, task.id, !task.done)}>
                  {task.done
                    ? <CheckSquare size={16} className="text-success flex-shrink-0 mt-0.5" />
                    : <Square size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.text}</p>
                    {assignee && (
                      <p className="text-xs text-text-muted mt-0.5">{assignee.name}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {currentTasks.length === 0 && (
            <p className="text-text-muted text-xs text-center py-4">אין משימות לשלב זה</p>
          )}

          {doneTasks === currentTasks.length && currentTasks.length > 0 && room.currentStage < STAGES.length - 1 && (
            <button
              onClick={() => { advanceStage(room.id); showToast('מעבר לשלב הבא! 🚀', 'success') }}
              className="w-full mt-4 py-2.5 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all shadow-glow-sm flex items-center justify-center gap-1.5">
              <ChevronRight size={14} />
              עבור לשלב הבא
            </button>
          )}
        </div>

        {/* Tab panel: Chat / Files / Activity */}
        <div className="lg:col-span-2 bg-bg1 rounded-2xl shadow-surface overflow-hidden flex flex-col" style={{ height: 520 }}>
          {/* Tab bar */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                onClick={() => setActiveTab(tid as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all flex-1 justify-center
                  ${activeTab === tid
                    ? 'text-purple border-b-2 border-purple'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg2/30'
                  }`}
                style={{ borderBottom: activeTab === tid ? '2px solid #a855f7' : '2px solid transparent' }}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {allMessages.length === 0 && (
                  <p className="text-center text-text-muted text-sm py-8">עדיין אין הודעות. התחל שיחה!</p>
                )}
                {allMessages.map(msg => {
                  const sender = getUserById(msg.userId)
                  if (!sender) return null
                  const isMe = msg.userId === user.id
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 fade-in ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar user={sender} size="sm" />
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm
                        ${isMe ? 'bg-purple/20 rounded-bl-md' : 'bg-bg3 rounded-br-md'}`}>
                        {!isMe && <p className="text-xs font-semibold text-purple mb-1">{sender.name}</p>}
                        <p className="text-text-primary leading-snug">{msg.text}</p>
                        <p className="text-xs text-text-muted mt-0.5">{msg.createdAt}</p>
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
                <button onClick={sendChat} disabled={!chatText.trim()}
                  className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-glow-sm flex-shrink-0">
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">{allStems.length} קבצים</p>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-gradient rounded-lg text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity shadow-glow-sm">
                  <Upload size={12} />
                  העלה קובץ
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {allStems.length === 0 ? (
                <div className="text-center py-8">
                  <Music2 size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">אין קבצים עדיין</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allStems.map(stem => {
                    const uploader = getUserById(stem.uploadedBy)
                    return (
                      <div key={stem.id} className="p-3 bg-bg2 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileMusic size={14} className="text-purple flex-shrink-0" />
                            <span className="text-xs font-medium text-text-primary">{stem.name}</span>
                          </div>
                          <span className="text-xs text-text-muted">{stem.size}</span>
                        </div>
                        <AudioPlayer url={stem.audioUrl} compact />
                        <div className="flex items-center justify-between mt-2">
                          {uploader && <span className="text-xs text-text-muted">{uploader.name}</span>}
                          <span className="text-xs text-text-muted">{stem.uploadedAt}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === 'activity' && (
            <div className="flex-1 overflow-y-auto p-4">
              {allActivity.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">אין פעילות עדיין</p>
              ) : (
                <div className="space-y-2">
                  {allActivity.map(item => {
                    const actor = getUserById(item.userId)
                    const typeColors: Record<string, string> = {
                      upload: 'bg-purple/10 text-purple',
                      comment: 'bg-info/10 text-info',
                      update: 'bg-success/10 text-success',
                      join: 'bg-pink/10 text-pink',
                      sign: 'bg-warning/10 text-warning',
                    }
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-bg2 rounded-xl">
                        {actor && <Avatar user={actor} size="sm" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {actor && <span className="text-xs font-semibold text-text-primary">{actor.name}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-md ${typeColors[item.type] || 'bg-bg3 text-text-muted'}`}>
                              {item.action}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members card */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} className="text-purple" />
          <h2 className="font-semibold text-sm">חברי הצוות</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {room.members.map(m => {
            const u = getUserById(m.userId)
            if (!u) return null
            return (
              <Link key={m.userId} href={`/profile/${u.id}`}
                className="flex flex-col items-center gap-2 p-3 bg-bg2 rounded-xl hover:bg-bg3 transition-colors group text-center">
                <Avatar user={u} size="md" showOnline />
                <div>
                  <p className="text-xs font-medium group-hover:text-purple transition-colors">{u.name}</p>
                  <p className="text-text-muted text-xs">{m.role}</p>
                  <p className="text-purple text-xs font-bold">{m.split}%</p>
                </div>
                {m.hasSigned && (
                  <span className="flex items-center gap-0.5 text-success text-xs">
                    <CheckCheck size={10} /> חתם
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
