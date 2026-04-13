'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { getUserById } from '@/lib/data'
import { useStore } from '@/lib/store'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'

interface Msg { id: string; fromMe: boolean; text: string; time: string }

interface Props {
  userId: string
  onClose: () => void
}

const QUICK_REPLIES = ['היי! 👋', 'אשמח לשתף פעולה', 'שלח/י פרטים נוספים', 'מה הטיימליין?', 'מה הסאונד שאתה/את מחפש/ת?']

export default function DmChatModal({ userId, onClose }: Props) {
  const { currentUser } = useStore()
  const user = getUserById(userId)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) return null
  const me = currentUser

  const send = (msg?: string) => {
    const t = (msg || text).trim()
    if (!t) return
    const newMsg: Msg = { id: Date.now().toString(), fromMe: true, text: t, time: 'עכשיו' }
    setMessages(prev => [...prev, newMsg])
    setText('')
    // Simulated reply
    setTimeout(() => {
      const replies = [
        `תודה על ההודעה! אחזור אליך בקרוב 🙏`,
        `נשמע מעניין! ספר/י לי עוד`,
        `אשמח לדון בזה! מה יש לך בראש?`,
        `👍 בטח, שלח/י לי פרטים`,
      ]
      const reply: Msg = {
        id: (Date.now() + 1).toString(),
        fromMe: false,
        text: replies[Math.floor(Math.random() * replies.length)],
        time: 'עכשיו',
      }
      setMessages(prev => [...prev, reply])
    }, 1000 + Math.random() * 800)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-md flex flex-col modal-card" style={{ height: 480, boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 16px 64px rgba(0,0,0,0.85)' }} onClick={e => e.stopPropagation()}>
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
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="flex justify-center mb-3"><Avatar user={user} size="lg" /></div>
              <p className="text-sm font-medium mb-1">{user.name}</p>
              <p className="text-text-muted text-xs mb-4">{user.bio.slice(0, 60)}...</p>
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
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 fade-in ${msg.fromMe ? 'flex-row-reverse' : ''}`}>
              {!msg.fromMe && <Avatar user={user} size="sm" />}
              <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm ${
                msg.fromMe ? 'bg-purple/25 text-text-primary rounded-bl-md' : 'bg-bg3 text-text-primary rounded-br-md'
              }`}>
                <p className="leading-snug">{msg.text}</p>
                <p className="text-xs text-text-muted mt-0.5 text-left">{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 border-t border-border flex-shrink-0">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`הודעה ל${user.name}...`}
            className="flex-1 bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
          />
          <button onClick={() => send()} disabled={!text.trim()}
            className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-glow-sm flex-shrink-0">
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
