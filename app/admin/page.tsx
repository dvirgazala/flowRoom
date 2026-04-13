'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music2, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react'

const ADMIN_PASSWORD = 'D123456'

export default function AdminGatePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin-auth', '1')
        router.push('/admin/dashboard')
      } else {
        setError(true)
        setLoading(false)
        setPassword('')
        setTimeout(() => setError(false), 2000)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4">
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Music2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold grad-text">FlowRoom</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ShieldAlert size={16} className="text-text-muted" />
            <p className="text-text-muted text-sm">ממשק ניהול מוגן</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-bg1 rounded-2xl p-8 shadow-surface-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center">
              <Lock size={18} className="text-danger" />
            </div>
            <div>
              <h1 className="font-bold">גישה מנהל</h1>
              <p className="text-text-muted text-xs">הכנס סיסמת מנהל להמשך</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="הכנס סיסמת מנהל"
                  autoFocus
                  className={`w-full bg-bg3 border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors pr-4 pl-10
                    ${error ? 'border-danger focus:border-danger animate-shake' : 'border-border focus:border-purple'}`}
                />
                <button type="button" onClick={() => setShow(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="text-danger text-xs mt-1.5">סיסמה שגויה. נסה שוב.</p>}
            </div>

            <button type="submit" disabled={!password || loading}
              className="w-full py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow-sm">
              {loading ? 'מאמת...' : 'כניסה לממשק'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          גישה מוגבלת לבעלי הרשאות בלבד
        </p>
      </div>
    </div>
  )
}
