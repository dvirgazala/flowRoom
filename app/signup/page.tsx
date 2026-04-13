'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { Music2 } from 'lucide-react'

const ROLES = ['זמר/ת', 'מפיק/ה', 'כותב/ת', 'נגן/ת', 'מיקס', 'עורך וידאו', 'שיווק']

export default function SignupPage() {
  const login = useStore(s => s.login)
  const showToast = useStore(s => s.showToast)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      // Mock signup — log in as u1 for demo
      login('u1')
      showToast('ברוך הבא ל-FlowRoom!', 'success')
      window.location.href = '/feed'
    }, 1000)
  }

  const quickSignup = (userId: string) => {
    login(userId)
    showToast('ברוך הבא ל-FlowRoom!', 'success')
    window.location.href = '/feed'
  }

  return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Music2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold grad-text">FlowRoom</span>
          </div>
          <p className="text-text-muted text-sm">הצטרף לקהילת יוצרי המוזיקה</p>
        </div>

        <div className="bg-bg1 rounded-2xl p-8 shadow-surface-lg">
          <h1 className="text-xl font-bold mb-1">צור חשבון</h1>
          <p className="text-text-muted text-sm mb-6">בחינם. תמיד.</p>

          {/* Social signup */}
          <div className="space-y-3 mb-6">
            {[
              { label: 'הירשם עם Google', bg: 'bg-white', text: 'text-gray-800', icon: '🇬' },
              { label: 'הירשם עם Facebook', bg: 'bg-[#1877F2]', text: 'text-white', icon: 'f' },
              { label: 'הירשם עם Apple', bg: 'bg-black border border-border', text: 'text-white', icon: '🍎' },
            ].map((p) => (
              <button key={p.label} onClick={() => quickSignup('u1')}
                className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl ${p.bg} ${p.text} text-sm font-medium hover:opacity-90 transition-opacity`}>
                <span className="text-base">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-xs">או</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">שם פרטי</label>
                <input required placeholder="אבי" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">שם משפחה</label>
                <input required placeholder="כהן" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">אימייל</label>
              <input required type="email" placeholder="you@example.com" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">סיסמה</label>
              <input required type="password" placeholder="מינימום 8 תווים" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">אני יוצר/ת —</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${role === r ? 'bg-purple/20 border-purple text-purple' : 'bg-bg3 border-border text-text-secondary hover:border-purple/50'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
              {loading ? 'יוצר חשבון...' : 'הצטרף עכשיו'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="text-purple hover:underline">התחבר</Link>
        </p>
      </div>
    </div>
  )
}
