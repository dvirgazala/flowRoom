'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { USERS } from '@/lib/data'
import { signOut, getMyNotifications, markAllNotificationsRead } from '@/lib/db'
import type { NotificationWithFrom } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { relativeTime } from '@/lib/profile-utils'
import Avatar from './Avatar'
import DmChatModal from './DmChatModal'
import VerifiedBadge from './VerifiedBadge'
import { Home, Music2, Search, ShoppingBag, LogOut, Bell, Plus, Settings, Briefcase, MessageCircle, ShieldCheck, Wallet } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const NOTIF_DOT: Record<string, string> = {
  like: 'bg-pink', comment: 'bg-info', follow: 'bg-purple',
  mention: 'bg-warning', room_invite: 'bg-purple', split_request: 'bg-warning',
}

function notifText(n: NotificationWithFrom): string {
  const who = n.from_user?.display_name ?? 'מישהו'
  if (n.type === 'like') return `${who} לייקה את הפוסט שלך`
  if (n.type === 'comment') return `${who} הגיב על הפוסט שלך`
  if (n.type === 'follow') return `${who} התחיל לעקוב אחריך`
  if (n.type === 'mention') return `${who} הזכיר אותך`
  if (n.type === 'room_invite') return `${who} הזמין אותך לחדר`
  if (n.type === 'split_request') return `${who} שלח בקשת splits`
  return n.message || 'התראה חדשה'
}

const NAV = [
  { href: '/feed',        label: 'פיד',     icon: Home },
  { href: '/rooms',       label: 'חדרים',   icon: Music2 },
  { href: '/rights',      label: 'זכויות',  icon: ShieldCheck },
  { href: '/discover',    label: 'גלה',     icon: Search },
  { href: '/marketplace', label: 'שוק',     icon: ShoppingBag },
  { href: '/gigs',        label: 'גיגים',   icon: Briefcase },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const currentUser = useStore(s => s.currentUser)
  const logout = useStore(s => s.logout)
  const showToast = useStore(s => s.showToast)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [chatListOpen, setChatListOpen] = useState(false)
  const [chatUserId, setChatUserId] = useState<string | null>(null)
  const [chatSearch, setChatSearch] = useState('')
  const [notifications, setNotifications] = useState<NotificationWithFrom[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    if (!hasSupabase || !currentUser) return
    const items = await getMyNotifications()
    setNotifications(items)
    setUnreadCount(items.filter(n => !n.read).length)
  }, [currentUser])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  // Realtime: new notifications
  useEffect(() => {
    if (!hasSupabase || !currentUser) return
    const channel = supabase
      .channel(`notifs:${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => {
        loadNotifications()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUser, loadNotifications])

  useEffect(() => {
    if (!menuOpen && !notifOpen && !chatListOpen) return
    const closeAll = () => { setMenuOpen(false); setNotifOpen(false); setChatListOpen(false) }
    const onClick = (e: Event) => {
      const t = e.target as Node
      if (notifRef.current?.contains(t) || menuRef.current?.contains(t) || chatRef.current?.contains(t)) return
      closeAll()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    window.addEventListener('scroll', closeAll, true)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
      window.removeEventListener('scroll', closeAll, true)
    }
  }, [menuOpen, notifOpen, chatListOpen])

  const handleLogout = async () => {
    await signOut().catch(() => {})
    logout()
    router.push('/login')
    showToast('התנתקת בהצלחה', 'info')
  }

  return (
    <nav className="fixed top-0 inset-x-0 h-16 bg-bg0/95 backdrop-blur-xl z-40 flex items-center px-6 gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 40px rgba(0,0,0,0.7)' }}>
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2 ml-auto">
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
          <Music2 size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg grad-text">FlowRoom</span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1 mx-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${active ? 'bg-purple/15 text-purple' : 'text-text-secondary hover:text-text-primary hover:bg-bg3'}`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 mr-auto">
        {/* New room */}
        <Link href="/rooms" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-gradient rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus size={14} />
          חדר חדש
        </Link>

        {/* Messages */}
        {currentUser && (
          <div className="relative" ref={chatRef}>
            <button onClick={() => { setChatListOpen(!chatListOpen); setNotifOpen(false); setMenuOpen(false) }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-bg3 hover:bg-bg2 transition-colors relative"
              aria-label="הודעות">
              <MessageCircle size={16} className="text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple rounded-full" />
            </button>
            {chatListOpen && (
              <div className="absolute left-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-bg2 rounded-xl overflow-hidden z-50 fade-in" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8)' }}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-semibold">הודעות</p>
                  <MessageCircle size={14} className="text-purple" />
                </div>
                <div className="px-3 pt-2 pb-1">
                  <input
                    value={chatSearch}
                    onChange={e => setChatSearch(e.target.value)}
                    placeholder="חפש משתמש..."
                    className="w-full bg-bg3 border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
                  />
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {USERS
                    .filter(u => u.id !== currentUser.id && (!chatSearch.trim() || u.name.includes(chatSearch.trim())))
                    .slice(0, 20)
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setChatUserId(u.id); setChatListOpen(false); setChatSearch('') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg3 transition-colors text-right"
                      >
                        <Avatar user={u} size="sm" showOnline />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                            {u.isVerified && <VerifiedBadge size={11} />}
                          </div>
                          <p className="text-xs text-text-muted truncate">{u.role}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => {
            const opening = !notifOpen
            setNotifOpen(opening); setMenuOpen(false); setChatListOpen(false)
            if (opening && unreadCount > 0) {
              markAllNotificationsRead().then(() => setUnreadCount(0))
            }
          }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg3 hover:bg-bg2 transition-colors relative">
            <Bell size={16} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-pink rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute left-0 top-12 w-72 max-w-[calc(100vw-2rem)] bg-bg2 rounded-xl overflow-hidden z-50" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8)' }}>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold">התראות</p>
                {notifications.length > 0 && <Bell size={13} className="text-text-muted" />}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-muted text-sm">אין התראות חדשות</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-bg3 cursor-pointer transition-colors flex items-start gap-3 border-b border-border/50 last:border-0 ${!n.read ? 'bg-purple/5' : ''}`}>
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${NOTIF_DOT[n.type] ?? 'bg-text-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{notifText(n)}</p>
                      <p className="text-xs text-text-muted mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu / login */}
        {currentUser ? (
          <div className="relative" ref={menuRef}>
            <button onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); setChatListOpen(false) }}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple/40 transition-all">
              <Avatar user={currentUser} size="sm" showOnline />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-12 w-56 max-w-[calc(100vw-2rem)] bg-bg2 rounded-2xl overflow-hidden z-50 fade-in" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8)' }}>
                <div className="px-4 py-3 border-b border-border bg-bg3/50">
                  <p className="text-sm font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-text-muted">{currentUser.role}</p>
                </div>
                <Link href={`/profile/${currentUser.id}`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg3 transition-colors">
                  <span className="text-base">👤</span> הפרופיל שלי
                </Link>
                <Link href="/rooms" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg3 transition-colors">
                  <span className="text-base">🎵</span> החדרים שלי
                </Link>
                <Link href="/earnings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg3 transition-colors">
                  <Wallet size={15} /> תיבת הכנסות
                </Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg3 transition-colors">
                  <Settings size={15} /> הגדרות
                </Link>
                <div className="border-t border-border">
                  <button onClick={handleLogout}
                    className="w-full text-right px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2.5">
                    <LogOut size={14} />
                    התנתק
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login"
            className="px-4 py-2 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
            כניסה
          </Link>
        )}
      </div>
      {chatUserId && <DmChatModal userId={chatUserId} onClose={() => setChatUserId(null)} />}
    </nav>
  )
}
