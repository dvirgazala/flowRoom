'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { USERS, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import {
  Users, ShieldAlert, Trash2, AlertTriangle, Ban, CheckCircle2,
  LogOut, Music2, Activity, BarChart3, Search, ChevronDown, ChevronUp,
  Eye, Crown, Clock, RefreshCw
} from 'lucide-react'

type Tab = 'users' | 'logs' | 'stats'

export default function AdminDashboard() {
  const router = useRouter()
  const { users, deleteUser, warnUser, suspendUser, unsuspendUser, verifyUser, adminLogs, addAdminLog, showToast, rooms, posts } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin-auth')) {
      router.replace('/admin')
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('admin-auth')
    router.push('/admin')
  }

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  const handleDelete = (userId: string) => {
    const u = getUserById(userId)
    deleteUser(userId)
    addAdminLog(`מחק משתמש ${u?.name}`, u?.name)
    showToast(`המשתמש ${u?.name} נמחק`, 'success')
    setConfirmDelete(null)
    setExpandedUser(null)
  }

  const handleWarn = (userId: string) => {
    const u = getUserById(userId)
    warnUser(userId)
    addAdminLog(`הזהיר משתמש ${u?.name}`, u?.name)
    showToast(`נשלחה אזהרה ל${u?.name}`, 'info')
  }

  const handleSuspend = (userId: string) => {
    const u = users.find(x => x.id === userId)
    if (u?.isSuspended) {
      unsuspendUser(userId)
      addAdminLog(`שחרר השהייה של ${u?.name}`, u?.name)
      showToast(`${u?.name} שוחרר מהשהייה`, 'success')
    } else {
      suspendUser(userId)
      addAdminLog(`השהה משתמש ${u?.name}`, u?.name)
      showToast(`${u?.name} הושהה`, 'info')
    }
  }

  const handleVerify = (userId: string) => {
    const u = getUserById(userId)
    verifyUser(userId)
    addAdminLog(`אימת משתמש ${u?.name}`, u?.name)
    showToast(`${u?.name} אומת בהצלחה ✓`, 'success')
  }

  const stats = {
    totalUsers: users.length,
    verified: users.filter(u => u.isVerified).length,
    suspended: users.filter(u => u.isSuspended).length,
    warned: users.filter(u => u.warnings > 0).length,
    totalRooms: rooms.length,
    totalPosts: posts.length,
    online: users.filter(u => u.isOnline).length,
  }

  return (
    <div className="min-h-screen bg-bg0">
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-bg1/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
              <Music2 size={15} className="text-white" />
            </div>
            <span className="font-bold text-sm">FlowRoom</span>
            <span className="text-text-muted text-xs">/</span>
            <div className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-danger" />
              <span className="text-sm font-semibold text-danger">Admin Dashboard</span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors">
            <LogOut size={14} />
            התנתק
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { label: 'משתמשים', value: stats.totalUsers, color: 'text-purple', icon: Users },
            { label: 'מאומתים', value: stats.verified, color: 'text-success', icon: CheckCircle2 },
            { label: 'מושהים', value: stats.suspended, color: 'text-danger', icon: Ban },
            { label: 'עם אזהרות', value: stats.warned, color: 'text-warning', icon: AlertTriangle },
            { label: 'חדרים', value: stats.totalRooms, color: 'text-info', icon: Music2 },
            { label: 'פוסטים', value: stats.totalPosts, color: 'text-pink', icon: Activity },
            { label: 'מחוברים', value: stats.online, color: 'text-success', icon: Eye },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-bg1 rounded-2xl p-4 text-center shadow-surface">
              <Icon size={18} className={`${color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-text-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg1 border border-border rounded-2xl p-1 mb-6 w-fit">
          {([['users', 'ניהול משתמשים', Users], ['logs', 'לוג פעולות', Activity], ['stats', 'סטטיסטיקות', BarChart3]] as const).map(([tab, label, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-brand-gradient text-white shadow-glow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative max-w-sm">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חפש משתמש..."
                  className="w-full bg-bg3 border border-border rounded-xl pr-10 pl-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">משתמש</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">תפקיד</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">Trust</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">סטטוס</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">הצטרף</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <>
                      <tr key={u.id}
                        className={`border-b border-border hover:bg-bg2/50 transition-colors cursor-pointer
                          ${u.isSuspended ? 'opacity-60' : ''}`}
                        onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={u} size="sm" showOnline />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">{u.name}</span>
                                {u.isVerified && <CheckCircle2 size={12} className="text-purple" />}
                                {u.warnings > 0 && <span className="text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded">⚠ {u.warnings}</span>}
                              </div>
                              <p className="text-text-muted text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{u.role}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${u.trustScore >= 80 ? 'text-success' : u.trustScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                            {u.trustScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.isSuspended ? (
                            <span className="text-xs px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded-lg">מושהה</span>
                          ) : u.isOnline ? (
                            <span className="text-xs px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-lg">מחובר</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-bg3 text-text-muted border border-border rounded-lg">לא פעיל</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">{u.joinedAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {!u.isVerified && (
                              <button onClick={() => handleVerify(u.id)} title="אמת משתמש"
                                className="p-1.5 bg-purple/10 hover:bg-purple/20 rounded-lg text-purple transition-colors">
                                <Crown size={13} />
                              </button>
                            )}
                            <button onClick={() => handleWarn(u.id)} title="הזהר"
                              className="p-1.5 bg-warning/10 hover:bg-warning/20 rounded-lg text-warning transition-colors">
                              <AlertTriangle size={13} />
                            </button>
                            <button onClick={() => handleSuspend(u.id)} title={u.isSuspended ? 'בטל השהייה' : 'השהה'}
                              className={`p-1.5 rounded-lg transition-colors ${u.isSuspended ? 'bg-success/10 hover:bg-success/20 text-success' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'}`}>
                              {u.isSuspended ? <RefreshCw size={13} /> : <Ban size={13} />}
                            </button>
                            <button onClick={() => setConfirmDelete(u.id)} title="מחק"
                              className="p-1.5 bg-danger/10 hover:bg-danger/20 rounded-lg text-danger transition-colors">
                              <Trash2 size={13} />
                            </button>
                            <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                              className="p-1.5 bg-bg3 hover:bg-bg2 rounded-lg text-text-muted transition-colors">
                              {expandedUser === u.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr key={`${u.id}-expand`} className="bg-bg2/30">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              {[
                                ['מיקום', u.location],
                                ['שירים', String(u.songs)],
                                ['שיתופים', String(u.collabs)],
                                ['עוקבים', String(u.followers)],
                                ['השלמת פרויקטים', `${u.completionRate}%`],
                                ['דירוג', String(u.rating)],
                                ['אזהרות', String(u.warnings)],
                                ['ז׳אנרים', u.genres.join(', ')],
                              ].map(([label, value]) => (
                                <div key={label} className="bg-bg3 rounded-xl p-3">
                                  <p className="text-text-muted mb-0.5">{label}</p>
                                  <p className="font-medium text-text-primary">{value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <Link href={`/profile/${u.id}`} target="_blank"
                                className="inline-flex items-center gap-1.5 text-xs text-purple hover:underline">
                                <Eye size={12} />
                                צפה בפרופיל הציבורי
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">לא נמצאו משתמשים</div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {activeTab === 'logs' && (
          <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity size={16} className="text-purple" />
                לוג פעולות מנהל
              </h2>
              <span className="text-xs text-text-muted">{adminLogs.length} רשומות</span>
            </div>
            <div className="divide-y divide-border">
              {adminLogs.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">אין פעולות עדיין</div>
              )}
              {[...adminLogs].reverse().map(log => (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-bg2/30 transition-colors">
                  <div className="w-8 h-8 bg-purple/10 border border-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldAlert size={14} className="text-purple" />
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
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* User breakdown */}
            <div className="bg-bg1 rounded-2xl p-5 shadow-surface">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-purple" />
                התפלגות תפקידים
              </h2>
              {(['מפיק', 'זמר/ת', 'כותב/ת', 'נגן/ת', 'מיקס', 'עורך וידאו', 'שיווק'] as const).map(role => {
                const count = users.filter(u => u.role === role).length
                const pct = users.length ? Math.round((count / users.length) * 100) : 0
                return (
                  <div key={role} className="mb-3">
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-text-secondary">{role}</span>
                      <span className="text-text-muted">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Platform health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg1 rounded-2xl p-5 shadow-surface">
                <h2 className="font-semibold mb-4">בריאות הפלטפורמה</h2>
                <div className="space-y-3">
                  {[
                    ['Trust Score ממוצע', Math.round(users.reduce((s, u) => s + u.trustScore, 0) / users.length) || 0, 100, 'text-success'],
                    ['שיעור אימות', Math.round((stats.verified / stats.totalUsers) * 100) || 0, 100, 'text-purple'],
                    ['שיעור השלמה ממוצע', Math.round(users.reduce((s, u) => s + u.completionRate, 0) / users.length) || 0, 100, 'text-info'],
                    ['שיעור השהייה', Math.round((stats.suspended / stats.totalUsers) * 100) || 0, 100, 'text-danger'],
                  ].map(([label, value, max, color]) => (
                    <div key={label as string}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-text-secondary">{label as string}</span>
                        <span className={color as string}>{value as number}%</span>
                      </div>
                      <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-brand-gradient`} style={{ width: `${value as number}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg1 rounded-2xl p-5 shadow-surface">
                <h2 className="font-semibold mb-4">תוכן</h2>
                <div className="space-y-3">
                  {[
                    ['חדרים פעילים', rooms.filter(r => r.isActive).length, rooms.length],
                    ['פוסטים', posts.length, posts.length],
                    ['תגובות', posts.reduce((s, p) => s + p.comments.length, 0), posts.reduce((s, p) => s + p.comments.length, 0)],
                    ['לייקים', posts.reduce((s, p) => s + p.likes, 0), posts.reduce((s, p) => s + p.likes, 0)],
                  ].map(([label, value, total]) => (
                    <div key={label as string} className="flex items-center justify-between p-3 bg-bg3 rounded-xl">
                      <span className="text-sm text-text-secondary">{label as string}</span>
                      <span className="font-bold">{value as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-bg1 border border-border rounded-2xl p-6 w-full max-w-sm shadow-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-danger" />
              </div>
              <div>
                <h2 className="font-bold">מחק משתמש</h2>
                <p className="text-text-muted text-sm">פעולה זו אינה ניתנת לביטול</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-5">
              האם אתה בטוח שברצונך למחוק את <strong className="text-text-primary">{users.find(u => u.id === confirmDelete)?.name}</strong>?
              כל הנתונים שלהם יימחקו לצמיתות.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-danger/15 border border-danger/30 rounded-xl text-danger text-sm font-semibold hover:bg-danger/25 transition-colors">
                כן, מחק
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-bg3 border border-border rounded-xl text-text-secondary text-sm hover:text-text-primary transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
