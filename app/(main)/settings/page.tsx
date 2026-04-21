'use client'
import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import Avatar from '@/components/Avatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import * as db from '@/lib/db'
import { Shield, CreditCard, User, Lock, CheckCircle2, Clock, Upload, Phone, IdCard, Music2, Moon, Sun, Loader2 } from 'lucide-react'

const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

type Tab = 'general' | 'verify' | 'bank' | 'privacy'

// Verification steps
const VERIFY_STEPS = [
  { id: 'email', label: 'אישור אימייל', desc: 'כתובת המייל שלך אומתה בהרשמה', icon: CheckCircle2, done: true },
  { id: 'phone', label: 'אימות טלפון', desc: 'אמת מספר טלפון לאבטחה נוספת', icon: Phone, done: false },
  { id: 'id', label: 'אימות זהות', desc: 'העלה תמונת תעודת זהות', icon: IdCard, done: false },
  { id: 'skills', label: 'אימות כישורים', desc: 'הוכחת מקצועיות (תיק עבודות + המלצות)', icon: Music2, done: false },
  { id: 'admin', label: 'אישור מנהל', desc: 'בדיקה ידנית — עד 48 שעות', icon: Shield, done: false },
]

const BANKS = ['בנק הפועלים', 'בנק לאומי', 'בנק דיסקונט', 'מזרחי-טפחות', 'בנק הבינלאומי', 'בנק ירושלים', 'בנק אוצר החייל']

export default function SettingsPage() {
  const { currentUser, updateCurrentUser, showToast, theme, setTheme } = useStore()
  const [tab, setTab] = useState<Tab>('general')

  // General tab state
  const [displayName, setDisplayName] = useState(currentUser?.name ?? '')
  const [bioText, setBioText] = useState(currentUser?.bio ?? '')
  const [locationText, setLocationText] = useState(currentUser?.location ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatarUrl ?? null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  const saveProfile = async () => {
    if (!displayName.trim()) { showToast('שם לא יכול להיות ריק', 'error'); return }
    setSavingProfile(true)
    if (!currentUser) return
    let newAvatarUrl = currentUser.avatarUrl

    if (avatarFile && hasSupabase) {
      const url = await db.uploadFile(avatarFile, 'avatars')
      if (url) newAvatarUrl = url
    }

    if (hasSupabase) {
      await db.updateProfile(currentUser.id, {
        display_name: displayName.trim(),
        bio: bioText.trim(),
        location: locationText.trim(),
        ...(newAvatarUrl && newAvatarUrl !== currentUser.avatarUrl ? { avatar_url: newAvatarUrl } : {}),
      })
    }

    updateCurrentUser({
      name: displayName.trim(),
      bio: bioText.trim(),
      location: locationText.trim(),
      ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
    })
    setSavingProfile(false)
    showToast('הפרטים עודכנו בהצלחה!', 'success')
  }

  // Verify state
  const [steps, setSteps] = useState(VERIFY_STEPS)
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneStep, setPhoneStep] = useState<'input' | 'code' | 'done'>('input')
  const [idFile, setIdFile] = useState<string | null>(null)
  const [skillsFile, setSkillsFile] = useState<string | null>(null)

  // Bank state
  const [bank, setBank] = useState('')
  const [branch, setBranch] = useState('')
  const [account, setAccount] = useState('')
  const [accountName, setAccountName] = useState(currentUser?.name ?? '')
  const [bankSaved, setBankSaved] = useState(false)

  const doneCount = steps.filter(s => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)

  const completeStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: true } : s))
    showToast('שלב הושלם! ✓', 'success')
  }

  const saveBank = () => {
    if (!bank || !branch || !account) { showToast('אנא מלא את כל השדות', 'error'); return }
    setBankSaved(true)
    showToast('פרטי חשבון הבנק נשמרו!', 'success')
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'כללי', icon: <User size={15} /> },
    { key: 'verify', label: 'אימות', icon: <Shield size={15} /> },
    { key: 'bank', label: 'חשבון בנק', icon: <CreditCard size={15} /> },
    { key: 'privacy', label: 'פרטיות', icon: <Lock size={15} /> },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">הגדרות חשבון</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="bg-bg1 rounded-2xl p-2 h-fit shadow-surface">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 text-right
                ${tab === key ? 'bg-purple/15 text-purple border border-purple/20' : 'text-text-secondary hover:text-text-primary hover:bg-bg3'}`}>
              {icon}
              {label}
              {key === 'verify' && doneCount < steps.length && (
                <span className="mr-auto text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">{doneCount}/{steps.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">

          {/* General */}
          {tab === 'general' && (
            <>
            <div className="bg-bg1 rounded-2xl p-6 space-y-4 shadow-surface">
              <h2 className="font-semibold mb-4">פרטים אישיים</h2>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="relative">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-purple/30" />
                    : <Avatar user={{ ...currentUser, avatarUrl: undefined } as any} size="xl" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{displayName}</p>
                    {currentUser?.isVerified && <VerifiedBadge size={16} />}
                  </div>
                  <p className="text-text-muted text-sm">{currentUser?.role} · {locationText || 'הוסף מיקום'}</p>
                  <button onClick={() => avatarInputRef.current?.click()}
                    className="mt-2 text-xs text-purple hover:underline flex items-center gap-1">
                    <Upload size={12} /> שנה תמונת פרופיל
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleAvatarChange(e.target.files[0]) }} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">שם מלא</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="שם מלא"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">אימייל</label>
                <input defaultValue={currentUser?.email ?? ''} placeholder="אימייל" disabled
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">מיקום</label>
                <input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="עיר / מדינה"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">ביוגרפיה</label>
                <textarea value={bioText} onChange={e => setBioText(e.target.value)} rows={3}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors" />
              </div>
              <button onClick={saveProfile} disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm disabled:opacity-60">
                {savingProfile ? <Loader2 size={14} className="animate-spin" /> : null}
                שמור שינויים
              </button>
            </div>

            {/* Theme picker */}
            <div className="bg-bg1 rounded-2xl p-6 shadow-surface">
              <h2 className="font-semibold mb-1">ערכת נושא</h2>
              <p className="text-text-muted text-xs mb-5">בחר את המראה המועדף עליך</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Dark */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`relative rounded-2xl p-4 text-right transition-all overflow-hidden group ${
                    theme === 'dark' ? 'ring-2 ring-purple' : 'hover:ring-1 hover:ring-purple/40'
                  }`}
                  style={{ background: '#0e0e24', boxShadow: theme === 'dark' ? '0 0 20px rgba(168,85,247,0.25)' : undefined }}>
                  {/* Mini preview */}
                  <div className="mb-4 space-y-1.5 pointer-events-none">
                    <div className="h-2 w-3/4 rounded-full" style={{ background: '#1e1e3c' }} />
                    <div className="h-2 w-1/2 rounded-full" style={{ background: '#252545' }} />
                    <div className="h-6 w-full rounded-lg mt-2" style={{ background: '#1e1e3c', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <div className="h-full w-2/5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-80" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon size={14} className="text-purple" />
                    <span className="text-sm font-semibold text-white">כהה</span>
                    {theme === 'dark' && (
                      <span className="mr-auto w-2 h-2 rounded-full bg-purple" />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#626576' }}>ברירת מחדל, ידידותי לעיניים</p>
                </button>

                {/* Light */}
                <button
                  onClick={() => setTheme('light')}
                  className={`relative rounded-2xl p-4 text-right transition-all overflow-hidden group ${
                    theme === 'light' ? 'ring-2 ring-purple' : 'hover:ring-1 hover:ring-purple/40'
                  }`}
                  style={{ background: '#ffffff', border: '1px solid #e0e0f0', boxShadow: theme === 'light' ? '0 0 20px rgba(168,85,247,0.2)' : undefined }}>
                  {/* Mini preview */}
                  <div className="mb-4 space-y-1.5 pointer-events-none">
                    <div className="h-2 w-3/4 rounded-full" style={{ background: '#eaeaf5' }} />
                    <div className="h-2 w-1/2 rounded-full" style={{ background: '#dcdcee' }} />
                    <div className="h-6 w-full rounded-lg mt-2" style={{ background: '#f4f4fc', border: '1px solid #dcdcee' }}>
                      <div className="h-full w-2/5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-90" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun size={14} className="text-warning" />
                    <span className="text-sm font-semibold" style={{ color: '#16162a' }}>בהיר</span>
                    {theme === 'light' && (
                      <span className="mr-auto w-2 h-2 rounded-full bg-purple" />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#8888a8' }}>נקי ומרענן</p>
                </button>
              </div>
            </div>
            </>
          )}

          {/* Verification */}
          {tab === 'verify' && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="bg-bg1 rounded-2xl p-5 shadow-surface">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">אימות חשבון</h2>
                  {currentUser?.isVerified ? (
                    <span className="flex items-center gap-1.5 text-success text-sm"><VerifiedBadge size={15} /> מאומת</span>
                  ) : (
                    <span className="text-xs text-text-muted">{doneCount}/{steps.length} שלבים</span>
                  )}
                </div>
                <div className="h-2 bg-bg3 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-text-muted">השלם את כל השלבים לקבלת "וי מאומת" בפרופיל שלך</p>
              </div>

              {/* Steps */}
              {steps.map((step, i) => {
                const Icon = step.icon
                const isNext = !step.done && steps.slice(0, i).every(s => s.done)

                return (
                  <div key={step.id} className={`bg-bg1 border rounded-2xl p-5 transition-all
                    ${step.done ? 'border-success/30 bg-success/5' : isNext ? 'border-purple/30' : 'border-border opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${step.done ? 'bg-success/20' : isNext ? 'bg-purple/15' : 'bg-bg3'}`}>
                        {step.done
                          ? <CheckCircle2 size={20} className="text-success" />
                          : <Icon size={20} className={isNext ? 'text-purple' : 'text-text-muted'} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{step.label}</p>
                          {step.done && <span className="text-success text-xs">✓ הושלם</span>}
                          {!step.done && !isNext && <span className="text-text-muted text-xs flex items-center gap-1"><Clock size={11} /> ממתין</span>}
                        </div>
                        <p className="text-text-muted text-xs mt-0.5">{step.desc}</p>

                        {/* Phone step */}
                        {step.id === 'phone' && isNext && !step.done && (
                          <div className="mt-3 space-y-2">
                            {phoneStep === 'input' && (
                              <div className="flex gap-2">
                                <input value={phone} onChange={e => setPhone(e.target.value)}
                                  placeholder="05X-XXX-XXXX" dir="ltr"
                                  className="flex-1 bg-bg3 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                                <button onClick={() => { if (phone.length >= 9) { setPhoneStep('code'); showToast('קוד SMS נשלח!', 'info') } }}
                                  className="px-4 py-2 bg-purple/20 border border-purple/30 rounded-xl text-xs text-purple hover:bg-purple/30 active:scale-95 transition-all">
                                  שלח קוד
                                </button>
                              </div>
                            )}
                            {phoneStep === 'code' && (
                              <div className="flex gap-2">
                                <input value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                                  placeholder="קוד 6 ספרות" maxLength={6} dir="ltr"
                                  className="flex-1 bg-bg3 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple tracking-widest text-center" />
                                <button onClick={() => { if (phoneCode.length === 6) { setPhoneStep('done'); completeStep('phone') } }}
                                  className="px-4 py-2 bg-brand-gradient rounded-xl text-xs text-white hover:opacity-90 active:scale-95 transition-all">
                                  אמת
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ID step */}
                        {step.id === 'id' && isNext && !step.done && (
                          <div className="mt-3">
                            {idFile ? (
                              <div className="flex items-center gap-2 justify-between">
                                <p className="text-xs text-success">✓ {idFile}</p>
                                <button onClick={() => completeStep('id')}
                                  className="px-3 py-1.5 bg-brand-gradient rounded-lg text-xs text-white hover:opacity-90 active:scale-95 transition-all">
                                  אשר ושלח
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-bg3 border border-border border-dashed rounded-xl text-xs text-text-secondary hover:border-purple/50 hover:text-purple transition-all w-fit">
                                <Upload size={14} />
                                העלה תעודת זהות / דרכון
                                <input type="file" accept="image/*,.pdf" className="hidden"
                                  onChange={e => setIdFile(e.target.files?.[0]?.name || null)} />
                              </label>
                            )}
                          </div>
                        )}

                        {/* Skills step */}
                        {step.id === 'skills' && isNext && !step.done && (
                          <div className="mt-3">
                            {skillsFile ? (
                              <div className="flex items-center gap-2 justify-between">
                                <p className="text-xs text-success">✓ {skillsFile}</p>
                                <button onClick={() => completeStep('skills')}
                                  className="px-3 py-1.5 bg-brand-gradient rounded-lg text-xs text-white hover:opacity-90 active:scale-95 transition-all">
                                  שלח לבדיקה
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-bg3 border border-border border-dashed rounded-xl text-xs text-text-secondary hover:border-purple/50 hover:text-purple transition-all w-fit">
                                <Upload size={14} />
                                העלה דוגמאות עבודה (MP3, ZIP...)
                                <input type="file" className="hidden"
                                  onChange={e => setSkillsFile(e.target.files?.[0]?.name || null)} />
                              </label>
                            )}
                          </div>
                        )}

                        {/* Admin step */}
                        {step.id === 'admin' && isNext && !step.done && (
                          <div className="mt-2">
                            <p className="text-xs text-warning bg-warning/10 border border-warning/20 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                              <Clock size={12} /> בדיקה בתהליך — עד 48 שעות
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bank account */}
          {tab === 'bank' && (
            <div className="bg-bg1 rounded-2xl p-6 space-y-4 shadow-surface">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-success/15 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-success" />
                </div>
                <div>
                  <h2 className="font-semibold">פרטי חשבון בנק</h2>
                  <p className="text-text-muted text-xs">לקבלת תשלומים דרך FlowRoom</p>
                </div>
                {bankSaved && <span className="mr-auto text-success text-xs flex items-center gap-1"><CheckCircle2 size={13} /> נשמר</span>}
              </div>

              <div className="bg-warning/8 border border-warning/20 rounded-xl p-3">
                <p className="text-xs text-warning">⚠️ הפרטים מוצפנים ומאובטחים. FlowRoom לא שומרת מספרי כרטיס אשראי.</p>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">בנק</label>
                <select value={bank} onChange={e => setBank(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple cursor-pointer">
                  <option value="">בחר בנק...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">מספר סניף</label>
                  <input value={branch} onChange={e => setBranch(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="XXX" dir="ltr"
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">מספר חשבון</label>
                  <input value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="XXXXXXXXXXX" dir="ltr"
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">שם בעל החשבון</label>
                <input value={accountName} onChange={e => setAccountName(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
              </div>

              <button onClick={saveBank}
                className="w-full py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-glow-sm">
                שמור פרטי חשבון
              </button>

              <p className="text-xs text-text-muted text-center">
                לאחר אישור פרטי הבנק תוכל לקבל תשלומים ממכירות ושיתופי פעולה
              </p>
            </div>
          )}

          {/* Privacy */}
          {tab === 'privacy' && (
            <div className="bg-bg1 rounded-2xl p-6 space-y-4 shadow-surface">
              <h2 className="font-semibold mb-4">הגדרות פרטיות</h2>
              {[
                { label: 'פרופיל ציבורי', desc: 'כל אחד יכול לראות את הפרופיל שלך', defaultVal: true },
                { label: 'הצג מיקום', desc: 'הצג עיר מגורים בפרופיל', defaultVal: true },
                { label: 'קבל הודעות מאנשים לא מוכרים', desc: 'אפשר למשתמשים שאינם קשרים לשלוח הודעות', defaultVal: false },
                { label: 'הצג ציון אמון', desc: 'הצג Trust Score לכל המשתמשים', defaultVal: true },
                { label: 'נראות ב-Discover', desc: 'הצג אותי בעמוד גלה יוצרים', defaultVal: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-text-muted">{s.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={s.defaultVal} className="sr-only peer" />
                    <div className="w-11 h-6 bg-bg3 border border-border rounded-full peer peer-checked:bg-purple/60 peer-checked:border-purple/50 transition-all after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[-20px]" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
