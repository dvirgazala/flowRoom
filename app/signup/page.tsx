'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { signUp } from '@/lib/db'
import { Music2, Eye, EyeOff } from 'lucide-react'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'

export default function SignupPage() {
  const router    = useRouter()
  const showToast = useStore(s => s.showToast)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const displayName = `${firstName} ${lastName}`.trim()
    const username = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/g, '') || email.split('@')[0]
    const { error } = await signUp({ email, password, username, displayName })
    setLoading(false)
    if (error) {
      showToast(error.message || 'שגיאה בהרשמה', 'error')
      return
    }
    showToast('ברוך הבא ל-FlowRoom!', 'success')
    setShowCompletion(true)
  }

  const handleCompletionDone = () => {
    setShowCompletion(false)
    router.push('/feed')
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">שם פרטי</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)}
                  required placeholder="אבי" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">שם משפחה</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)}
                  required placeholder="כהן" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">אימייל</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                required type="email" placeholder="you@example.com" className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">סיסמה</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  required type={showPass ? 'text' : 'password'} minLength={6} placeholder="מינימום 6 תווים"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

      {showCompletion && <ProfileCompletionModal onDone={handleCompletionDone} />}
    </div>
  )
}
