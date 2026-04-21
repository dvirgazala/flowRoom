'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { USERS } from '@/lib/data'
import { signOut, getMyNotifications, markAllNotificationsRead, getConversations, acceptRoomInvite, declineRoomInvite } from '@/lib/db'
import type { NotificationWithFrom, Conversation } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { relativeTime } from '@/lib/profile-utils'
import Avatar from './Avatar'
import DmChatModal from './DmChatModal'
import VerifiedBadge from './VerifiedBadge'
import { Home, Music2, Search, ShoppingBag, LogOut, Bell, Plus, Settings, Briefcase, MessageCircle, ShieldCheck, Wallet, LayoutDashboard } from 'lucide-react'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'dvirgazala13579@gmail.com'
import { useState, useEffect, useRef, useCallback } from 'react'

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const NOTIF_DOT: Record<string, string> = {
  like: 'bg-pink', comment: 'bg-info', follow: 'bg-purple',
  mention: 'bg-warning', room_invite: 'bg-purple', split_request: 'bg-warning',
  room_admin: 'bg-yellow-400',
}

function notifText(n: NotificationWithFrom): string {
  const who = n.from_user?.display_name ?? 'מישהו'
  if (n.type === 'like') return `${who} לייקה את הפוסט שלך`
  if (n.type === 'comment') return `${who} הגיב על הפוסט שלך`
  if (n.type === 'follow') return `${who} התחיל לעקוב אחריך`
  if (n.type === 'mention') return `${who} הזכיר אותך`
  if (n.type === 'room_invite') return `${who} הזמין אותך לחדר`
  if (n.type === 'split_request') return `${who} שלח בקשת splits`
  if (n.type === 'room_admin') return n.message || `${who} הפך אותך למנהל חדר`
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [dmUnread, setDmUnread] = useState(0)
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

  const loadConversations = useCallback(async () => {
    if (!hasSupabase || !currentUser) return
    const convos = await getConversations()
    setConversations(convos)
    setDmUnread(convos.reduce((acc, c) => acc + c.unreadCount, 0))
  }, [currentUser])

  useEffect(() => { loadNotifications() }, [loadNotifications])
  useEffect(() => { loadConversations() }, [loadConversations])

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
        {/* Admin dashboard button — only for admin user */}
        {currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
          <Link href="/admin/dashboard"
            onClick={() => sessionStorage.setItem('admin-auth', '1')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/20 rounded-lg text-xs font-medium text-danger hover:bg-danger/20 transition-colors">
            <LayoutDashboard size={14} />
            דשבורד
          </Link>
        )}

        {/* New room */}
        <Link href="/rooms" className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-gradient rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus size={14} />
          חדר חדש
        </Link>

        {/* Messages */}
        {currentUser && (
          <div className="relative" ref={chatRef}>
            <button onClick={() => { setChatListOpen(!chatListOpen); setNotifOpen(false); setMenuOpen(false); if (!chatListOpen) loadConversations() }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-bg3 hover:bg-bg2 transition-colors relative"
              aria-label="הודעות">
              <MessageCircle size={16} className="text-text-secondary" />
              {dmUnread > 0 ? (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-purple rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {dmUnread > 9 ? '9+' : dmUnread}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple rounded-full" />
              )}
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
                  {/* Recent conversations (when no search) */}
                  {!chatSearch.trim() && conversations.length > 0 && (() => {
                    const convoUsers = conversations
                      .map(c => ({ convo: c, user: USERS.find(u => u.id === c.userId) }))
                      .filter(x => x.user && x.user.id !== currentUser.id)
                    if (convoUsers.length === 0) return null
                    return (
                      <>
                        <p className="text-[10px] text-text-muted px-4 pt-1 pb-0.5 uppercase tracking-wide">שיחות אחרונות</p>
                        {convoUsers.map(({ convo, user: u }) => u && (
                          <button key={u.id}
                            onClick={() => { setChatUserId(u.id); setChatListOpen(false); setChatSearch(''); loadConversations() }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg3 transition-colors text-right">
                            <Avatar user={u} size="sm" showOnline />
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center gap-1 justify-between">
                                <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                                {convo.unreadCount > 0 && (
                                  <span className="flex-shrink-0 min-w-[18px] h-4.5 px-1 bg-purple rounded-full text-white text-[10px] font-bold flex items-center justify-center">{convo.unreadCount}</span>
                                )}
                              </div>
                              <p className="text-xs text-text-muted truncate">{convo.lastMessage}</p>
                            </div>
                          </button>
                        ))}
                        <p className="text-[10px] text-text-muted px-4 pt-2 pb-0.5 uppercase tracking-wide border-t border-border mt-1">כל המשתמשים</p>
                      </>
                    )
                  })()}
                  {/* All users (filtered by search) */}
                  {USERS
                    .filter(u => u.id !== currentUser.id && (!chatSearch.trim() || u.name.includes(chatSearch.trim())))
                    .filter(u => chatSearch.trim() || !conversations.some(c => c.userId === u.id))
                    .slice(0, 15)
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
                  <div key={n.id} className={`px-4 py-3 transition-colors flex items-start gap-3 border-b border-border/50 last:border-0 ${!n.read ? 'bg-purple/5' : ''}`}>
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${NOTIF_DOT[n.type] ?? 'bg-text-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{notifText(n)}</p>
                      <p className="text-xs text-text-muted mt-0.5">{relativeTime(n.created_at)}</p>
                      {n.type === 'room_invite' && n.room_id && !n.read && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async () => {
                              await acceptRoomInvite(n.id, n.room_id!)
                              setNotifications(prev => prev.filter(x => x.id !== n.id))
                              showToast('הצטרפת לחדר!', 'success')
                              router.push(`/rooms/${n.room_id}`)
                            }}
                            className="px-3 py-1 bg-brand-gradient rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                            קבל
                          </button>
                          <button
                            onClick={async () => {
                              await declineRoomInvite(n.id)
                              setNotifications(prev => prev.filter(x => x.id !== n.id))
                            }}
                            className="px-3 py-1 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors">
                            דחה
                          </button>
                        </div>
                      )}
                      {n.type === 'room_admin' && n.room_id && (
                        <button
                          onClick={() => { setNotifOpen(false); router.push(`/rooms/${n.room_id}`) }}
                          className="mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-xs font-semibold text-yellow-400 hover:bg-yellow-500/30 transition-colors">
                          לך לחדר
                        </button>
                      )}
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
