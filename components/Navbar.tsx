'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { signOut } from '@/lib/db'
import Avatar from './Avatar'
import { Home, Music2, Search, ShoppingBag, LogOut, Bell, Plus, Settings, Briefcase } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/feed',        label: 'פיד',     icon: Home },
  { href: '/rooms',       label: 'חדרים',   icon: Music2 },
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

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg3 hover:bg-bg2 transition-colors relative">
            <Bell size={16} className="text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute left-0 top-12 w-72 max-w-[calc(100vw-2rem)] bg-bg2 rounded-xl overflow-hidden z-50" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.8)' }}>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">התראות</p>
              </div>
              {[
                { text: 'אבי כהן הזמין אותך לחדר יצירה', time: 'לפני 10 דקות', dot: 'bg-purple' },
                { text: 'יעל לוי לייקה את הפוסט שלך', time: 'לפני שעה', dot: 'bg-pink' },
                { text: 'הסכם Splits מחכה לחתימתך', time: 'לפני 3 שעות', dot: 'bg-warning' },
                { text: 'רון כץ הגיב על הסקיצה שלך', time: 'אתמול', dot: 'bg-info' },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-bg3 cursor-pointer transition-colors flex items-start gap-3 border-b border-border/50 last:border-0">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                  <div>
                    <p className="text-sm text-text-primary">{n.text}</p>
                    <p className="text-xs text-text-muted mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User menu / login */}
        {currentUser ? (
          <div className="relative">
            <button onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false) }}
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
    </nav>
  )
}
