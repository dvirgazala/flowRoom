'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { USERS } from '@/lib/data'
import { Music2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router    = useRouter()
  const login     = useStore(s => s.login)
  const showToast = useStore(s => s.showToast)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const user = USERS.find(u => u.email === email)
    if (user) {
      login(user.id)
      router.push('/feed')
    } else {
      showToast('אימייל או סיסמה שגויים', 'error')
    }
  }

  const mockLogin = (userId: string) => {
    login(userId)
    router.push('/feed')
  }

  return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Music2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold grad-text">FlowRoom</span>
          </div>
          <p className="text-text-muted text-sm">הבית של יוצרי המוזיקה העצמאים</p>
        </div>

        <div className="bg-bg1 rounded-2xl p-8 shadow-surface-lg">
          <h1 className="text-xl font-bold mb-1">התחבר לחשבון</h1>
          <p className="text-text-muted text-sm mb-6">ברוך הבא בחזרה</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">אימייל</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="you@example.com" required
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">סיסמה</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded" />
                זכור אותי
              </label>
              <button type="button" onClick={() => showToast('שחזור סיסמה — בקרוב', 'info')}
                className="text-xs text-purple hover:underline">
                שכחת סיסמה?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-glow-sm">
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-xs">או המשך עם</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex justify-center gap-4 mb-6">
            {[
              { icon: 'G', bg: 'bg-white', text: 'text-gray-700', label: 'Google', font: 'font-bold text-base' },
              { icon: 'f', bg: 'bg-[#1877F2]', text: 'text-white', label: 'Facebook', font: 'font-bold text-lg' },
              { icon: '🍎', bg: 'bg-black border border-border', text: 'text-white', label: 'Apple', font: 'text-lg' },
            ].map(p => (
              <button type="button" key={p.label} onClick={() => mockLogin('u1')}
                className={`w-12 h-12 rounded-xl ${p.bg} ${p.text} ${p.font} flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-sm`}>
                {p.icon}
              </button>
            ))}
          </div>

          <div className="pt-5 border-t border-border">
            <p className="text-xs text-text-muted mb-3 text-center">כניסה מהירה לבדיקות:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'u1', label: 'אבי — מפיק' },
                { id: 'u3', label: 'יעל — זמרת' },
                { id: 'u9', label: 'רחל — מיקס' },
              ].map(u => (
                <button type="button" key={u.id} onClick={() => mockLogin(u.id)}
                  className="py-2.5 px-3 bg-bg3 hover:bg-bg2 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors active:scale-95">
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          אין לך חשבון?{' '}
          <Link href="/signup" className="text-purple hover:underline">הירשם עכשיו</Link>
        </p>
      </div>
    </div>
  )
}
