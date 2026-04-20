'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import * as db from '@/lib/db'
import type { PostWithAuthor } from '@/lib/db'
import type { DbProfile, DbRoom } from '@/lib/supabase-types'
import { profileToUser, relativeTime } from '@/lib/profile-utils'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import {
  Users, ShieldAlert, Trash2, AlertTriangle, Ban, CheckCircle2,
  LogOut, Music2, Activity, BarChart3, Search, ChevronDown, ChevronUp,
  Eye, Crown, Clock, RefreshCw, Loader2, FileText, Home, Mic2,
  MessageSquare, TrendingUp, UserCheck, UserX, Image, Zap,
  Edit2, Check, X, ExternalLink, Filter, Shield,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'users' | 'content' | 'rooms' | 'logs'

interface AdminStats {
  totalUsers: number; totalPosts: number; postsToday: number
  activeRooms: number; onlineUsers: number; newUsersWeek: number
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'סקירה כללית', icon: Home },
  { key: 'users',   label: 'משתמשים',      icon: Users },
  { key: 'content', label: 'תכנים',         icon: FileText },
  { key: 'rooms',   label: 'חדרים',         icon: Mic2 },
  { key: 'logs',    label: 'לוג פעולות',    icon: Activity },
]

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, desc, onConfirm, onCancel, danger = true }: {
  title: string; desc: string; onConfirm: () => void; onCancel: () => void; danger?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-bg1 border border-border rounded-2xl p-6 w-full max-w-sm shadow-surface-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-danger/10 border border-danger/20' : 'bg-warning/10 border border-warning/20'}`}>
            <AlertTriangle size={18} className={danger ? 'text-danger' : 'text-warning'} />
          </div>
          <div>
            <h2 className="font-bold">{title}</h2>
            <p className="text-text-muted text-xs">{desc}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${danger ? 'bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25' : 'bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25'}`}>
            אשר
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2.5 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-bg1 rounded-2xl p-5 shadow-surface border border-border/30">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-opacity-15 ${color.replace('text-', 'bg-')}/10`}>
          <Icon size={17} className={color} />
        </div>
        {sub && <span className="text-xs text-text-muted">{sub}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-text-muted text-xs mt-0.5">{label}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const { adminLogs, addAdminLog, showToast } = useStore()
  const [tab, setTab] = useState<Tab>('overview')

  // Auth guard
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin-auth')) {
      router.replace('/admin')
    }
  }, [router])

  // ── Data ────────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [dbUsers, setDbUsers] = useState<DbProfile[]>([])
  const [dbPosts, setDbPosts] = useState<PostWithAuthor[]>([])
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [s, u, p, r] = await Promise.all([
      db.adminGetStats().catch(() => null),
      db.listAllProfiles(200).catch(() => []),
      db.adminGetAllPosts(200).catch(() => []),
      db.adminGetAllRooms().catch(() => []),
    ])
    if (s) setStats(s)
    setDbUsers(u)
    setDbPosts(p)
    setDbRooms(r)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleLogout = () => { sessionStorage.removeItem('admin-auth'); router.push('/admin') }

  // ── Users state ─────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'suspended' | 'warned'>('all')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editBio, setEditBio] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ type: string; id: string; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filteredUsers = dbUsers.filter(u => {
    const q = userSearch.toLowerCase()
    const matches = !q || u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    if (!matches) return false
    if (userFilter === 'verified') return u.is_verified
    if (userFilter === 'suspended') return u.is_suspended
    if (userFilter === 'warned') return u.warnings > 0
    return true
  })

  const userAction = async (action: string, userId: string, name: string) => {
    setActionLoading(userId + action)
    const patch: Partial<DbProfile> = {}
    let log = ''
    if (action === 'verify') { patch.is_verified = true; log = `אימת: ${name}` }
    if (action === 'unverify') { patch.is_verified = false; log = `ביטול אימות: ${name}` }
    if (action === 'suspend') { patch.is_suspended = true; log = `השהה: ${name}` }
    if (action === 'unsuspend') { patch.is_suspended = false; log = `שחרר השהיה: ${name}` }
    if (action === 'warn') { const u = dbUsers.find(x => x.id === userId); patch.warnings = (u?.warnings ?? 0) + 1; log = `אזהרה ל: ${name}` }
    if (action === 'delete') {
      await db.adminDeleteProfile(userId)
      setDbUsers(prev => prev.filter(u => u.id !== userId))
      addAdminLog(`מחק משתמש: ${name}`, name)
      showToast(`${name} נמחק`, 'success')
      setConfirmModal(null)
      setActionLoading(null)
      return
    }
    await db.adminUpdateProfile(userId, patch)
    setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u))
    addAdminLog(log, name)
    showToast(log, 'success')
    setActionLoading(null)
    setConfirmModal(null)
  }

  const saveUserEdit = async (userId: string) => {
    const patch: Partial<DbProfile> = { display_name: editName, role: editRole, bio: editBio }
    await db.adminUpdateProfile(userId, patch)
    setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u))
    addAdminLog(`עדכן פרטי משתמש: ${editName}`, editName)
    showToast('פרטי משתמש עודכנו', 'success')
    setEditingUser(null)
  }

  // ── Content state ────────────────────────────────────────────────────────────
  const [postSearch, setPostSearch] = useState('')
  const [postFilter, setPostFilter] = useState<'all' | 'image' | 'audio'>('all')
  const [confirmDeletePost, setConfirmDeletePost] = useState<string | null>(null)

  const filteredPosts = dbPosts.filter(p => {
    const q = postSearch.toLowerCase()
    const matches = !q || p.content.toLowerCase().includes(q) || (p.author?.display_name ?? '').toLowerCase().includes(q)
    if (!matches) return false
    if (postFilter === 'image') return p.media_urls?.length > 0
    if (postFilter === 'audio') return !!p.audio_url
    return true
  })

  const deletePost = async (id: string) => {
    await db.deletePost(id)
    setDbPosts(prev => prev.filter(p => p.id !== id))
    addAdminLog(`מחק פוסט`, id)
    showToast('הפוסט נמחק', 'success')
    setConfirmDeletePost(null)
  }

  // ── Rooms state ──────────────────────────────────────────────────────────────
  const [roomSearch, setRoomSearch] = useState('')
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<string | null>(null)

  const filteredRooms = dbRooms.filter(r =>
    !roomSearch.trim() || r.name.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const deleteRoom = async (id: string) => {
    await db.adminDeleteRoom(id)
    setDbRooms(prev => prev.filter(r => r.id !== id))
    addAdminLog(`מחק חדר`, id)
    showToast('החדר נמחק', 'success')
    setConfirmDeleteRoom(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg0 flex flex-col">
      {/* Confirm modals */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.type === 'delete-user' ? 'מחק משתמש לצמיתות' : confirmModal.type === 'suspend' ? 'השהה משתמש' : 'פעולה'}
          desc={`${confirmModal.name}`}
          onConfirm={() => userAction(confirmModal.type === 'delete-user' ? 'delete' : confirmModal.type, confirmModal.id, confirmModal.name)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {confirmDeletePost && (
        <ConfirmModal title="מחק פוסט" desc="הפוסט יימחק לצמיתות" onConfirm={() => deletePost(confirmDeletePost)} onCancel={() => setConfirmDeletePost(null)} />
      )}
      {confirmDeleteRoom && (
        <ConfirmModal title="מחק חדר" desc="החדר וכל תוכנו יימחקו" onConfirm={() => deleteRoom(confirmDeleteRoom)} onCancel={() => setConfirmDeleteRoom(null)} />
      )}

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-bg1/95 backdrop-blur-md border-b border-border flex items-center px-4 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <Music2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-sm grad-text">FlowRoom</span>
          <span className="text-text-muted text-xs">/</span>
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-danger" />
            <span className="text-sm font-semibold text-danger">Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mr-auto">
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            רענן
          </button>
          <Link href="/feed" target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple/10 border border-purple/30 rounded-xl text-xs text-purple hover:bg-purple/20 transition-colors">
            <ExternalLink size={12} />
            צפה בפלטפורמה
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-danger hover:border-danger/30 transition-colors">
            <LogOut size={13} />
            יציאה
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 bg-bg1 border-l border-border fixed top-14 bottom-0 right-0 py-4 px-2 overflow-y-auto">
          <nav className="space-y-0.5">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right
                  ${tab === key ? 'bg-purple/15 text-purple border border-purple/20' : 'text-text-secondary hover:text-text-primary hover:bg-bg3'}`}>
                <Icon size={15} />
                {label}
                {key === 'users' && dbUsers.length > 0 && (
                  <span className="mr-auto text-[10px] bg-bg3 text-text-muted px-1.5 py-0.5 rounded">{dbUsers.length}</span>
                )}
                {key === 'content' && dbPosts.length > 0 && (
                  <span className="mr-auto text-[10px] bg-bg3 text-text-muted px-1.5 py-0.5 rounded">{dbPosts.length}</span>
                )}
                {key === 'rooms' && dbRooms.length > 0 && (
                  <span className="mr-auto text-[10px] bg-bg3 text-text-muted px-1.5 py-0.5 rounded">{dbRooms.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-border mx-2">
            <p className="text-[10px] text-text-muted text-center">FlowRoom Admin v2</p>
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-bg1 border-b border-border flex overflow-x-auto no-scrollbar px-2 py-1.5 gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
                ${tab === key ? 'bg-purple/15 text-purple' : 'text-text-muted hover:text-text-secondary'}`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 md:mr-52 px-4 md:px-6 py-6 mt-10 md:mt-0 overflow-y-auto">

          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-purple" />
            </div>
          )}

          {!loading && (
            <>
              {/* ── OVERVIEW ──────────────────────────────────────────────── */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-bold">סקירה כללית</h1>
                    <p className="text-text-muted text-sm">מצב הפלטפורמה בזמן אמת</p>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <StatCard label="סה״כ משתמשים" value={stats?.totalUsers ?? dbUsers.length} icon={Users} color="text-purple" />
                    <StatCard label="משתמשים חדשים השבוע" value={stats?.newUsersWeek ?? 0} icon={TrendingUp} color="text-success" sub="7 ימים" />
                    <StatCard label="מחוברים עכשיו" value={stats?.onlineUsers ?? dbUsers.filter(u => u.is_online).length} icon={Zap} color="text-success" />
                    <StatCard label="סה״כ פוסטים" value={stats?.totalPosts ?? dbPosts.length} icon={FileText} color="text-info" />
                    <StatCard label="פוסטים היום" value={stats?.postsToday ?? 0} icon={Activity} color="text-pink" />
                    <StatCard label="חדרים פעילים" value={stats?.activeRooms ?? dbRooms.filter(r => r.is_active).length} icon={Mic2} color="text-warning" />
                  </div>

                  {/* Quick summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User breakdown */}
                    <div className="bg-bg1 rounded-2xl shadow-surface p-5">
                      <h2 className="font-semibold mb-4 flex items-center gap-2"><Users size={15} className="text-purple" /> סטטוס משתמשים</h2>
                      {[
                        { label: 'מאומתים', count: dbUsers.filter(u => u.is_verified).length, color: 'bg-purple/60', icon: UserCheck },
                        { label: 'מושהים', count: dbUsers.filter(u => u.is_suspended).length, color: 'bg-danger/60', icon: UserX },
                        { label: 'עם אזהרות', count: dbUsers.filter(u => u.warnings > 0).length, color: 'bg-warning/60', icon: AlertTriangle },
                        { label: 'מנהלים', count: dbUsers.filter(u => u.is_admin).length, color: 'bg-success/60', icon: Shield },
                      ].map(({ label, count, color, icon: Icon }) => (
                        <div key={label} className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <Icon size={13} className="text-text-muted" />
                            <span className="text-sm text-text-secondary">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-bg3 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color}`} style={{ width: `${dbUsers.length ? (count / dbUsers.length * 100) : 0}%` }} />
                            </div>
                            <span className="text-sm font-bold w-6 text-left">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recent posts */}
                    <div className="bg-bg1 rounded-2xl shadow-surface p-5">
                      <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText size={15} className="text-info" /> פוסטים אחרונים</h2>
                      {dbPosts.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-start gap-2.5 mb-3 last:mb-0">
                          {p.author && <Avatar user={profileToUser(p.author)} size="sm" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary">{p.author?.display_name}</p>
                            <p className="text-xs text-text-muted truncate">{p.content.slice(0, 60)}{p.content.length > 60 ? '...' : ''}</p>
                          </div>
                          <span className="text-[10px] text-text-muted flex-shrink-0">{relativeTime(p.created_at)}</span>
                        </div>
                      ))}
                      {dbPosts.length === 0 && <p className="text-text-muted text-sm text-center py-4">אין פוסטים עדיין</p>}
                    </div>
                  </div>

                  {/* Role breakdown */}
                  <div className="bg-bg1 rounded-2xl shadow-surface p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-purple" /> התפלגות תפקידים</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['מפיק', 'זמר/ת', 'כותב/ת', 'נגן/ת', 'מיקס', 'עורך וידאו', 'שיווק', 'אחר'].map(role => {
                        const count = dbUsers.filter(u => u.role === role || (!['מפיק', 'זמר/ת', 'כותב/ת', 'נגן/ת', 'מיקס', 'עורך וידאו', 'שיווק'].includes(u.role) && role === 'אחר')).length
                        const pct = dbUsers.length ? Math.round(count / dbUsers.length * 100) : 0
                        return (
                          <div key={role} className="bg-bg3 rounded-xl p-3">
                            <p className="text-xs text-text-muted mb-1">{role}</p>
                            <p className="font-bold text-lg">{count}</p>
                            <div className="h-1 bg-bg2 rounded-full overflow-hidden mt-2">
                              <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ─────────────────────────────────────────────────── */}
              {tab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-xl font-bold">ניהול משתמשים</h1>
                      <p className="text-text-muted text-sm">{filteredUsers.length} מתוך {dbUsers.length} משתמשים</p>
                    </div>
                  </div>

                  {/* Search + filters */}
                  <div className="bg-bg1 rounded-2xl shadow-surface p-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                        placeholder="חפש לפי שם, שם משתמש, תפקיד..."
                        className="w-full bg-bg3 border border-border rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-purple transition-colors" />
                    </div>
                    <div className="flex gap-1.5">
                      {([['all', 'הכל'], ['verified', 'מאומתים'], ['suspended', 'מושהים'], ['warned', 'עם אזהרות']] as const).map(([f, l]) => (
                        <button key={f} onClick={() => setUserFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${userFilter === f ? 'bg-purple/20 border-purple/40 text-purple' : 'bg-bg3 border-border text-text-muted hover:text-text-secondary'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users table */}
                  <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">משתמש</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden sm:table-cell">תפקיד</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden md:table-cell">עוקבים</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">סטטוס</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">פעולות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <>
                              <tr key={u.id}
                                className={`border-b border-border/60 hover:bg-bg2/40 transition-colors ${u.is_suspended ? 'opacity-60' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar user={profileToUser(u)} size="sm" showOnline />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-medium truncate">{u.display_name}</span>
                                        {u.is_verified && <CheckCircle2 size={12} className="text-purple flex-shrink-0" />}
                                        {u.is_admin && <Shield size={11} className="text-success flex-shrink-0" />}
                                        {u.warnings > 0 && <span className="text-[10px] text-warning bg-warning/10 px-1 py-0.5 rounded flex-shrink-0">⚠ {u.warnings}</span>}
                                      </div>
                                      <p className="text-text-muted text-xs">@{u.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-text-secondary hidden sm:table-cell">{u.role}</td>
                                <td className="px-4 py-3 text-sm hidden md:table-cell">{u.followers_count}</td>
                                <td className="px-4 py-3">
                                  {u.is_suspended
                                    ? <span className="text-xs px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded-lg">מושהה</span>
                                    : u.is_online
                                      ? <span className="text-xs px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-lg">מחובר</span>
                                      : <span className="text-xs px-2 py-0.5 bg-bg3 text-text-muted border border-border rounded-lg">לא פעיל</span>
                                  }
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    {!u.is_verified
                                      ? <button onClick={() => userAction('verify', u.id, u.display_name)} disabled={!!actionLoading}
                                          title="אמת" className="p-1.5 bg-purple/10 hover:bg-purple/25 rounded-lg text-purple transition-colors disabled:opacity-40">
                                          <Crown size={12} />
                                        </button>
                                      : <button onClick={() => userAction('unverify', u.id, u.display_name)} disabled={!!actionLoading}
                                          title="בטל אימות" className="p-1.5 bg-purple/10 hover:bg-purple/25 rounded-lg text-purple transition-colors disabled:opacity-40">
                                          <UserX size={12} />
                                        </button>
                                    }
                                    <button onClick={() => userAction('warn', u.id, u.display_name)} disabled={!!actionLoading}
                                      title="הזהר" className="p-1.5 bg-warning/10 hover:bg-warning/25 rounded-lg text-warning transition-colors disabled:opacity-40">
                                      <AlertTriangle size={12} />
                                    </button>
                                    <button onClick={() => setConfirmModal({ type: u.is_suspended ? 'unsuspend' : 'suspend', id: u.id, name: u.display_name })}
                                      disabled={!!actionLoading}
                                      title={u.is_suspended ? 'בטל השהיה' : 'השהה'}
                                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${u.is_suspended ? 'bg-success/10 hover:bg-success/25 text-success' : 'bg-orange-500/10 hover:bg-orange-500/25 text-orange-400'}`}>
                                      {u.is_suspended ? <RefreshCw size={12} /> : <Ban size={12} />}
                                    </button>
                                    <button onClick={() => { setEditingUser(u.id); setEditName(u.display_name); setEditRole(u.role); setEditBio(u.bio || ''); setExpandedUser(u.id) }}
                                      title="ערוך" className="p-1.5 bg-info/10 hover:bg-info/25 rounded-lg text-info transition-colors">
                                      <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => setConfirmModal({ type: 'delete-user', id: u.id, name: u.display_name })}
                                      title="מחק" className="p-1.5 bg-danger/10 hover:bg-danger/25 rounded-lg text-danger transition-colors disabled:opacity-40">
                                      <Trash2 size={12} />
                                    </button>
                                    <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                      className="p-1.5 bg-bg3 hover:bg-bg2 rounded-lg text-text-muted transition-colors">
                                      {expandedUser === u.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedUser === u.id && (
                                <tr key={`${u.id}-expand`} className="bg-bg2/20">
                                  <td colSpan={5} className="px-5 py-4">
                                    {editingUser === u.id ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                          <label className="text-xs text-text-muted mb-1 block">שם תצוגה</label>
                                          <input value={editName} onChange={e => setEditName(e.target.value)}
                                            className="w-full bg-bg3 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                                        </div>
                                        <div>
                                          <label className="text-xs text-text-muted mb-1 block">תפקיד</label>
                                          <input value={editRole} onChange={e => setEditRole(e.target.value)}
                                            className="w-full bg-bg3 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                                        </div>
                                        <div>
                                          <label className="text-xs text-text-muted mb-1 block">ביו</label>
                                          <input value={editBio} onChange={e => setEditBio(e.target.value)}
                                            className="w-full bg-bg3 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                                        </div>
                                        <div className="sm:col-span-3 flex gap-2">
                                          <button onClick={() => saveUserEdit(u.id)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90">
                                            <Check size={12} /> שמור
                                          </button>
                                          <button onClick={() => setEditingUser(null)}
                                            className="px-4 py-2 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary">
                                            ביטול
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        {[
                                          ['מיקום', u.location || '—'],
                                          ['עוקבים', String(u.followers_count)],
                                          ['שירים', String(u.songs_count)],
                                          ['דירוג', String(u.rating)],
                                          ['אזהרות', String(u.warnings)],
                                          ['הצטרף', new Date(u.created_at).toLocaleDateString('he-IL')],
                                          ['אתר', u.website || '—'],
                                          ['מזהה', u.id.slice(0, 12) + '...'],
                                        ].map(([label, value]) => (
                                          <div key={label} className="bg-bg3 rounded-xl p-3">
                                            <p className="text-text-muted mb-0.5">{label}</p>
                                            <p className="font-medium text-text-primary truncate">{value}</p>
                                          </div>
                                        ))}
                                        <div className="sm:col-span-4 mt-1">
                                          <Link href={`/profile/${u.id}`} target="_blank"
                                            className="inline-flex items-center gap-1.5 text-xs text-purple hover:underline">
                                            <ExternalLink size={11} /> צפה בפרופיל ציבורי
                                          </Link>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-10 text-text-muted text-sm">לא נמצאו משתמשים</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CONTENT ───────────────────────────────────────────────── */}
              {tab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold">ניהול תכנים</h1>
                    <p className="text-text-muted text-sm">{filteredPosts.length} פוסטים</p>
                  </div>

                  <div className="bg-bg1 rounded-2xl shadow-surface p-4 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={postSearch} onChange={e => setPostSearch(e.target.value)}
                        placeholder="חפש לפי תוכן או שם משתמש..."
                        className="w-full bg-bg3 border border-border rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-purple transition-colors" />
                    </div>
                    <div className="flex gap-1.5">
                      {([['all', 'הכל'], ['image', 'תמונות'], ['audio', 'אודיו']] as const).map(([f, l]) => (
                        <button key={f} onClick={() => setPostFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${postFilter === f ? 'bg-purple/20 border-purple/40 text-purple' : 'bg-bg3 border-border text-text-muted hover:text-text-secondary'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">מחבר</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">תוכן</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden sm:table-cell">סוג</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden md:table-cell">לייקים</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden md:table-cell">תגובות</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">תאריך</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">פעולה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPosts.map(p => (
                          <tr key={p.id} className="border-b border-border/60 hover:bg-bg2/40 transition-colors">
                            <td className="px-4 py-3">
                              {p.author && (
                                <div className="flex items-center gap-2">
                                  <Avatar user={profileToUser(p.author)} size="sm" />
                                  <span className="text-xs font-medium">{p.author.display_name}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <p className="text-xs text-text-secondary truncate">{p.content.slice(0, 80)}{p.content.length > 80 ? '...' : ''}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex gap-1">
                                {p.media_urls?.length > 0 && <span className="flex items-center gap-0.5 text-[10px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded"><Image size={9} /> תמונה</span>}
                                {p.audio_url && <span className="flex items-center gap-0.5 text-[10px] bg-purple/10 text-purple border border-purple/20 px-1.5 py-0.5 rounded"><Mic2 size={9} /> אודיו</span>}
                                {!p.media_urls?.length && !p.audio_url && <span className="text-[10px] bg-bg3 text-text-muted border border-border px-1.5 py-0.5 rounded">טקסט</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm hidden md:table-cell">{p.likes_count}</td>
                            <td className="px-4 py-3 text-sm hidden md:table-cell">{p.comments_count}</td>
                            <td className="px-4 py-3 text-xs text-text-muted">{relativeTime(p.created_at)}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => setConfirmDeletePost(p.id)}
                                className="p-1.5 bg-danger/10 hover:bg-danger/25 rounded-lg text-danger transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPosts.length === 0 && (
                      <div className="text-center py-10 text-text-muted text-sm">אין פוסטים</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── ROOMS ─────────────────────────────────────────────────── */}
              {tab === 'rooms' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold">ניהול חדרים</h1>
                    <p className="text-text-muted text-sm">{filteredRooms.length} חדרים</p>
                  </div>

                  <div className="bg-bg1 rounded-2xl shadow-surface p-4">
                    <div className="relative max-w-sm">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={roomSearch} onChange={e => setRoomSearch(e.target.value)}
                        placeholder="חפש חדר..."
                        className="w-full bg-bg3 border border-border rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-purple transition-colors" />
                    </div>
                  </div>

                  <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">שם חדר</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden sm:table-cell">ז׳אנר</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted hidden md:table-cell">שלב</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">סטטוס</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">נוצר</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">פעולה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRooms.map(r => (
                          <tr key={r.id} className="border-b border-border/60 hover:bg-bg2/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                                  <Mic2 size={13} className="text-purple" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{r.name}</p>
                                  {r.description && <p className="text-xs text-text-muted truncate max-w-[180px]">{r.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-xs px-2 py-0.5 bg-purple/10 text-purple border border-purple/20 rounded-lg">{r.genre}</span>
                            </td>
                            <td className="px-4 py-3 text-sm hidden md:table-cell">שלב {r.current_stage}/6</td>
                            <td className="px-4 py-3">
                              {r.is_active
                                ? <span className="text-xs px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-lg">פעיל</span>
                                : <span className="text-xs px-2 py-0.5 bg-bg3 text-text-muted border border-border rounded-lg">סגור</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-xs text-text-muted">{relativeTime(r.created_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Link href={`/rooms/${r.id}`} target="_blank"
                                  className="p-1.5 bg-info/10 hover:bg-info/25 rounded-lg text-info transition-colors">
                                  <ExternalLink size={12} />
                                </Link>
                                <button onClick={() => setConfirmDeleteRoom(r.id)}
                                  className="p-1.5 bg-danger/10 hover:bg-danger/25 rounded-lg text-danger transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRooms.length === 0 && (
                      <div className="text-center py-10 text-text-muted text-sm">אין חדרים</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── LOGS ──────────────────────────────────────────────────── */}
              {tab === 'logs' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold">לוג פעולות מנהל</h1>
                    <p className="text-text-muted text-sm">{adminLogs.length} פעולות</p>
                  </div>

                  <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
                    {adminLogs.length === 0 && (
                      <div className="text-center py-12 text-text-muted text-sm">אין פעולות עדיין</div>
                    )}
                    <div className="divide-y divide-border/50">
                      {[...adminLogs].reverse().map(log => (
                        <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg2/30 transition-colors">
                          <div className="w-8 h-8 bg-purple/10 border border-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShieldAlert size={13} className="text-purple" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary">{log.action}</p>
                            {log.targetUser && <p className="text-xs text-text-muted">יעד: {log.targetUser}</p>}
                          </div>
                          <div className="flex items-center gap-1 text-text-muted text-xs flex-shrink-0">
                            <Clock size={11} />
                            {log.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
