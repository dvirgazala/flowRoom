'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { getUserById } from '@/lib/data'
import { useStore } from '@/lib/store'
import * as db from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { relativeTime } from '@/lib/profile-utils'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

interface Msg { id: string; fromMe: boolean; text: string; createdAt: string }

interface Props {
  userId: string
  onClose: () => void
}

const QUICK_REPLIES = ['היי! 👋', 'אשמח לשתף פעולה', 'שלח/י פרטים נוספים', 'מה הטיימליין?', 'מה הסאונד שאתה/את מחפש/ת?']

export default function DmChatModal({ userId, onClose }: Props) {
  const { currentUser, users } = useStore()
  const user = users.find(u => u.id === userId) || getUserById(userId)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Load thread on mount
  useEffect(() => {
    if (!hasSupabase || !currentUser) { setLoading(false); return }
    db.getDmThread(userId).then(rows => {
      setMessages(rows.map(r => ({
        id: r.id,
        fromMe: r.from_user_id === currentUser.id,
        text: r.text,
        createdAt: r.created_at,
      })))
      setLoading(false)
      setTimeout(() => scrollToBottom(false), 50)
    })
    db.markDmsRead(userId)
  }, [userId, currentUser, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    if (!hasSupabase || !currentUser) return
    const channel = supabase
      .channel(`dm:${[currentUser.id, userId].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      }, payload => {
        const row = payload.new as { id: string; from_user_id: string; to_user_id: string; text: string; created_at: string }
        const isForMe = (row.from_user_id === userId && row.to_user_id === currentUser.id)
          || (row.from_user_id === currentUser.id && row.to_user_id === userId)
        if (!isForMe) return
        setMessages(prev => {
          if (prev.some(m => m.id === row.id)) return prev
          return [...prev, { id: row.id, fromMe: row.from_user_id === currentUser.id, text: row.text, createdAt: row.created_at }]
        })
        setTimeout(() => scrollToBottom(), 50)
        if (row.from_user_id === userId) db.markDmsRead(userId)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, currentUser, scrollToBottom])

  useEffect(() => { if (!loading) scrollToBottom() }, [messages.length, loading, scrollToBottom])

  if (!user) return null

  const send = async (msg?: string) => {
    const t = (msg || text).trim()
    if (!t || sending || !currentUser) return
    setText('')
    setSending(true)
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, { id: tempId, fromMe: true, text: t, createdAt: new Date().toISOString() }])
    setTimeout(() => scrollToBottom(), 50)
    if (hasSupabase) {
      const result = await db.sendDm(userId, t)
      if (result?.data?.[0]) {
        const real = result.data[0] as { id: string; created_at: string }
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: real.id, createdAt: real.created_at } : m))
      }
    }
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center sm:p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col modal-card"
        style={{ height: 'min(520px, calc(100dvh - env(safe-area-inset-top) - 64px))', maxWidth: '100vw', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 16px 64px rgba(0,0,0,0.85)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <Avatar user={user} size="md" showOnline />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm">{user.name}</p>
              {user.isVerified && <VerifiedBadge size={13} />}
            </div>
            <p className="text-text-muted text-xs">{user.role} · {user.isOnline ? '🟢 מחובר' : 'לא מחובר'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="text-text-muted animate-spin" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3"><Avatar user={user} size="lg" /></div>
              <p className="text-sm font-medium mb-1">{user.name}</p>
              <p className="text-text-muted text-xs mb-4">{user.bio?.slice(0, 60)}{(user.bio?.length ?? 0) > 60 ? '...' : ''}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_REPLIES.map(r => (
                  <button key={r} onClick={() => send(r)}
                    className="px-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-purple hover:border-purple/40 active:scale-95 transition-all">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!loading && messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 fade-in ${msg.fromMe ? 'flex-row-reverse' : ''}`}>
              {!msg.fromMe && <Avatar user={user} size="sm" />}
              <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${
                msg.fromMe ? 'bg-purple/25 text-text-primary rounded-bl-md' : 'bg-bg3 text-text-primary rounded-br-md'
              }`}>
                <p className="leading-snug">{msg.text}</p>
                <p className="text-xs text-text-muted mt-0.5 text-left">{relativeTime(msg.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 border-t border-border flex-shrink-0">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`הודעה ל${user.name}...`}
            className="flex-1 bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
          />
          <button onClick={() => send()} disabled={!text.trim() || sending}
            className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-glow-sm flex-shrink-0">
            {sending ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
