'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getMySheets } from '@/lib/db'
import type { RegistrationBody, RegistrationStatus } from '@/lib/types'
import type { FullSplitSheet, DbSplitRegistration } from '@/lib/supabase-types'
import { fetchBodiesMeta, BODIES_FALLBACK, isStale, formatVerifiedDate, type BodyMeta } from '@/lib/regulatory'
import RegistrationModal from '@/components/RegistrationModal'
import {
  ShieldCheck, CheckCircle2, AlertCircle, Clock, XCircle, ArrowUpRight,
  Music2, FileText, Lock, Zap, TrendingUp, HelpCircle, Wallet, RefreshCw,
  ChevronLeft, Filter, HelpCircle as EligibilityIcon,
} from 'lucide-react'

export const BODIES = BODIES_FALLBACK
export const BODY_ORDER: RegistrationBody[] = ['acum', 'pil', 'eshkolot', 'distributor', 'youtube-cid']

const STATUS_META: Record<RegistrationStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  registered:     { label: 'רשום',  icon: CheckCircle2, color: 'text-success',    bg: 'bg-success/10 border-success/30' },
  pending:        { label: 'הוגש',  icon: Clock,        color: 'text-warning',    bg: 'bg-warning/10 border-warning/30' },
  rejected:       { label: 'נדחה',  icon: XCircle,      color: 'text-danger',     bg: 'bg-danger/10 border-danger/30' },
  not_registered: { label: 'חסר',   icon: AlertCircle,  color: 'text-text-muted', bg: 'bg-bg3 border-border' },
}

type FilterType = 'all' | 'missing' | 'pending' | 'complete'

const ELIGIBILITY_QUESTIONS = [
  { id: 'writer',    label: 'כתבת מילים או לחנת את השיר?',       bodies: ['acum'] },
  { id: 'master',    label: 'אתה בעל ההקלטה (מפיק/ליבל)?',        bodies: ['pil', 'youtube-cid'] },
  { id: 'performer', label: 'ביצעת את השיר (זמר/נגן)?',           bodies: ['eshkolot'] },
  { id: 'release',   label: 'השיר יוצא לפלטפורמות דיגיטליות?',   bodies: ['distributor'] },
]

export default function RightsPage() {
  const { currentUser } = useStore()
  const [sheets, setSheets] = useState<FullSplitSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [bodies, setBodies] = useState<Record<RegistrationBody, BodyMeta>>(BODIES_FALLBACK)
  const [modal, setModal] = useState<{ sheetId: string; body: RegistrationBody; lastVerifiedAt?: string; sheet: FullSplitSheet } | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [eligibilityOpen, setEligibilityOpen] = useState(false)
  const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([getMySheets(), fetchBodiesMeta()]).then(([sh, b]) => {
      setSheets(sh)
      setBodies(b)
      setLoading(false)
    })
  }, [])

  const stats = useMemo(() => {
    let totalSlots = 0, registered = 0, pending = 0, missing = 0
    sheets.forEach(sh => {
      sh.registrations.forEach(r => {
        totalSlots++
        if (r.status === 'registered') registered++
        else if (r.status === 'pending') pending++
        else missing++
      })
    })
    return { totalSlots, registered, pending, missing, tracks: sheets.length }
  }, [sheets])

  const filteredSheets = useMemo(() => {
    if (filter === 'all') return sheets
    return sheets.filter(sh => {
      const regs = sh.registrations
      if (filter === 'missing')  return regs.some(r => r.status === 'not_registered')
      if (filter === 'pending')  return regs.some(r => r.status === 'pending')
      if (filter === 'complete') return regs.every(r => r.status === 'registered')
      return true
    })
  }, [sheets, filter])

  // Relevant bodies from eligibility answers
  const relevantBodies = useMemo<Set<RegistrationBody>>(() => {
    const set = new Set<RegistrationBody>()
    ELIGIBILITY_QUESTIONS.forEach(q => {
      if (eligibilityAnswers[q.id]) q.bodies.forEach(b => set.add(b as RegistrationBody))
    })
    return set
  }, [eligibilityAnswers])

  // "Next action" for first locked sheet with missing registrations
  const nextActionSheet = useMemo(() => {
    return sheets.find(sh =>
      sh.status === 'locked' && sh.registrations.some(r => r.status === 'not_registered'),
    )
  }, [sheets])

  const nextMissingBody = useMemo<RegistrationBody | null>(() => {
    if (!nextActionSheet) return null
    const reg = nextActionSheet.registrations.find(r => r.status === 'not_registered')
    return (reg?.body ?? null) as RegistrationBody | null
  }, [nextActionSheet])

  const handleRegistrationClose = async () => {
    setModal(null)
    const [sh] = await Promise.all([getMySheets()])
    setSheets(sh)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={18} className="text-purple" />
        <span className="text-xs text-purple font-semibold">Rights Protection · FlowRoom</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">זכויות וכסף</h1>
          <p className="text-text-secondary text-sm mt-1 mb-6">
            המקום שבו אנחנו דואגים שהכסף שמגיע לך — יגיע. מול כל גוף רלוונטי, לכל שיר.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setEligibilityOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg1 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all shadow-surface">
            <EligibilityIcon size={14} />
            מה רלוונטי לי?
          </button>
          <Link href="/earnings"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
            <Wallet size={15} />
            תיבת הכנסות
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="שירים פעילים"       value={stats.tracks}     icon={Music2}       color="text-purple" />
        <StatCard label="רישומים פעילים"      value={stats.registered} icon={CheckCircle2} color="text-success"
          hint={stats.totalSlots ? `${Math.round((stats.registered / stats.totalSlots) * 100)}% מהסך` : ''} />
        <StatCard label="ממתינים לאישור"      value={stats.pending}    icon={Clock}        color="text-warning" />
        <StatCard label="חסרים — כסף על השולחן" value={stats.missing}  icon={AlertCircle}  color="text-danger"
          hint={stats.missing > 0 ? 'רישומים שלא בוצעו' : 'הכל מכוסה'} />
      </div>

      {/* Next action wizard — shows only when relevant */}
      {nextActionSheet && nextMissingBody && (
        <div className="bg-bg1 rounded-2xl shadow-surface p-5 mb-6 border border-warning/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">הצעד הבא — רישום "{nextActionSheet.track_title}"</p>
              <p className="text-text-secondary text-xs mb-3">
                ה-Split Sheet נעול. עכשיו צריך לרשום את השיר מול הגופים הרלוונטיים כדי שהכסף יגיע.
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {BODY_ORDER.map((body, i) => {
                  const reg = nextActionSheet.registrations.find(r => r.body === body)
                  const status = reg?.status ?? 'not_registered'
                  const isNext = body === nextMissingBody && status === 'not_registered'
                  return (
                    <div key={body} className="flex items-center gap-1">
                      {i > 0 && <ChevronLeft size={12} className="text-text-muted" />}
                      <button
                        onClick={() => status === 'not_registered'
                          ? setModal({ sheetId: nextActionSheet.id, body, lastVerifiedAt: bodies[body]?.lastVerifiedAt, sheet: nextActionSheet })
                          : undefined}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          status === 'registered'  ? 'bg-success/10 text-success border border-success/30' :
                          status === 'pending'     ? 'bg-warning/10 text-warning border border-warning/30' :
                          isNext                   ? 'bg-brand-gradient text-white shadow-glow-sm cursor-pointer' :
                          'bg-bg3 text-text-muted border border-border cursor-pointer hover:border-purple/40'
                        }`}>
                        {status === 'registered' ? '✓ ' : ''}{bodies[body]?.short ?? body}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational banner */}
      {!nextActionSheet && (
        <div className="bg-bg1 rounded-2xl shadow-surface p-5 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.04))' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">איך זה עובד?</p>
              <p className="text-text-secondary text-xs leading-relaxed">
                כל שיר שאתה מייצר ב-FlowRoom מקבל Split Sheet חתום — ואז אנחנו מראים לך בדיוק איפה הוא רשום ואיפה חסר.
                <strong className="text-text-primary"> כל רישום חסר = כסף שלא מגיע אליך.</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {sheets.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter size={13} className="text-text-muted flex-shrink-0" />
          {([
            { key: 'all',      label: 'הכל' },
            { key: 'missing',  label: 'חסר רישום' },
            { key: 'pending',  label: 'ממתין לאישור' },
            { key: 'complete', label: 'מלא' },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-brand-gradient text-white shadow-glow-sm'
                  : 'bg-bg1 border border-border text-text-secondary hover:border-purple/40'
              }`}>
              {f.label}
              {f.key !== 'all' && (
                <span className="mr-1.5 opacity-70">
                  ({f.key === 'missing'  ? sheets.filter(s => s.registrations.some(r => r.status === 'not_registered')).length
                  : f.key === 'pending'  ? sheets.filter(s => s.registrations.some(r => r.status === 'pending')).length
                  : f.key === 'complete' ? sheets.filter(s => s.registrations.every(r => r.status === 'registered')).length
                  : sheets.length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sheet list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSheets.length === 0 && sheets.length === 0 ? (
        <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
          <Music2 size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-1">עדיין אין שירים במעקב</p>
          <p className="text-text-muted text-xs mb-5">
            צור חדר חדש, סיים Split Sheet — והשיר יופיע כאן אוטומטית עם כל גוף שצריך לרשום בו.
          </p>
          <Link href="/rooms"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
            <ArrowUpRight size={15} />צור חדר חדש
          </Link>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="bg-bg1 rounded-2xl shadow-surface p-8 text-center text-text-muted text-sm">
          אין שירים שמתאימים לפילטר הזה
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSheets.map(sheet => (
            <TrackCard key={sheet.id} sheet={sheet} bodies={bodies} relevantBodies={relevantBodies}
              onOpenRegistration={(body) => setModal({ sheetId: sheet.id, body, lastVerifiedAt: bodies[body]?.lastVerifiedAt, sheet })} />
          ))}
        </div>
      )}

      {/* Footer tip */}
      <div className="mt-6 flex items-start gap-2 p-4 bg-bg1 rounded-2xl shadow-surface">
        <HelpCircle size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-muted leading-relaxed">
          לא בטוח איזה גוף רלוונטי לשיר שלך? ל-<strong className="text-text-primary">מלחין/פזמונאי</strong> חייב אקו"ם,
          ל-<strong className="text-text-primary">מפיק/בעל מאסטר</strong> חייב הפיל, ל-<strong className="text-text-primary">מבצע/נגן</strong> חייב אשכולות.
          כל שיר שיוצא דיגיטלית חייב דיסטריביוטור ו-Content ID.
          {' '}<button onClick={() => setEligibilityOpen(true)} className="text-purple hover:underline">בדוק מה רלוונטי לך &larr;</button>
        </p>
      </div>

      {modal && (
        <RegistrationModal
          sheetId={modal.sheetId}
          body={modal.body}
          lastVerifiedAt={modal.lastVerifiedAt}
          sheet={modal.sheet}
          onClose={handleRegistrationClose}
        />
      )}

      {/* Eligibility check modal */}
      {eligibilityOpen && (
        <EligibilityModal
          answers={eligibilityAnswers}
          onChange={setEligibilityAnswers}
          bodies={bodies}
          relevantBodies={relevantBodies}
          onClose={() => setEligibilityOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, hint }: {
  label: string; value: number; icon: typeof CheckCircle2; color: string; hint?: string
}) {
  return (
    <div className="bg-bg1 rounded-2xl shadow-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  )
}

/* ── Track card ────────────────────────────────────────────────────────── */
function TrackCard({ sheet, bodies, relevantBodies, onOpenRegistration }: {
  sheet: FullSplitSheet
  bodies: Record<RegistrationBody, BodyMeta>
  relevantBodies: Set<RegistrationBody>
  onOpenRegistration: (body: RegistrationBody) => void
}) {
  const regs = sheet.registrations
  const locked = sheet.status === 'locked'

  const registeredCount = regs.filter(r => r.status === 'registered').length
  const pct = BODY_ORDER.length > 0 ? Math.round((registeredCount / BODY_ORDER.length) * 100) : 0

  const writers = sheet.participants
    .filter(p => p.category === 'publishing' && Number(p.share_pct) > 0)
    .map(p => p.profile.display_name)

  return (
    <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Music2 size={15} className="text-purple flex-shrink-0" />
              <h3 className="font-semibold truncate">{sheet.track_title}</h3>
              {locked ? (
                <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded">
                  <Lock size={10} /> Split נעול
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded">
                  <AlertCircle size={10} /> Split לא נעול
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
              {writers.length > 0 && <span>כותבים: {writers.slice(0, 3).join(', ')}{writers.length > 3 ? ` +${writers.length - 3}` : ''}</span>}
              {sheet.isrc && <span>· ISRC {sheet.isrc}</span>}
              {sheet.iswc && <span>· ISWC {sheet.iswc}</span>}
            </div>
          </div>
          <Link href={`/rooms/${sheet.room_id}/splits`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all flex-shrink-0">
            <FileText size={12} /> חוזה
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-1.5 bg-bg3 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono font-semibold text-text-secondary tabular-nums">{registeredCount}/{BODY_ORDER.length}</span>
          <TrendingUp size={11} className={pct === 100 ? 'text-success' : 'text-text-muted'} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 pb-5">
        {BODY_ORDER.map(bodyKey => {
          const body = bodies[bodyKey] ?? BODIES[bodyKey]
          const reg = regs.find((r: DbSplitRegistration) => r.body === bodyKey)
          const status = (reg?.status ?? 'not_registered') as RegistrationStatus
          const statusMeta = STATUS_META[status]
          const StatusIcon = statusMeta.icon
          const stale = body.lastVerifiedAt ? isStale(body.lastVerifiedAt) : false
          const isRelevant = relevantBodies.size === 0 || relevantBodies.has(bodyKey)

          return (
            <button key={bodyKey} onClick={() => onOpenRegistration(bodyKey)}
              className={`text-right p-3 rounded-xl border transition-all hover:border-purple/50 hover:bg-bg3
                ${status === 'registered' ? 'border-success/30 bg-success/5' : 'border-border bg-bg1'}
                ${relevantBodies.size > 0 && !isRelevant ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${body.color}`}>{body.label}</span>
                <div className="flex items-center gap-1">
                  {stale && <RefreshCw size={10} className="text-warning" />}
                  <StatusIcon size={13} className={statusMeta.color} />
                </div>
              </div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
              {reg?.reference && (
                <p className="text-[10px] text-text-muted mt-1 font-mono truncate">{reg.reference}</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Eligibility check modal ───────────────────────────────────────────── */
function EligibilityModal({ answers, onChange, bodies, relevantBodies, onClose }: {
  answers: Record<string, boolean>
  onChange: (a: Record<string, boolean>) => void
  bodies: Record<RegistrationBody, BodyMeta>
  relevantBodies: Set<RegistrationBody>
  onClose: () => void
}) {
  const allAnswered = ELIGIBILITY_QUESTIONS.every(q => q.id in answers)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-md modal-card"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}>

        <div className="px-6 py-4 border-b border-border">
          <p className="font-bold">מה רלוונטי לי?</p>
          <p className="text-xs text-text-muted mt-0.5">ענה על 4 שאלות — נסמן את הגופים הרלוונטיים לך</p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {ELIGIBILITY_QUESTIONS.map(q => (
            <div key={q.id} className="flex items-start justify-between gap-4 p-3 bg-bg2 rounded-xl">
              <p className="text-sm flex-1">{q.label}</p>
              <div className="flex gap-2 flex-shrink-0">
                {['כן', 'לא'].map((opt, i) => {
                  const val = i === 0
                  const selected = answers[q.id] === val
                  return (
                    <button key={opt} onClick={() => onChange({ ...answers, [q.id]: val })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? val ? 'bg-success/20 text-success border border-success/40' : 'bg-bg3 text-text-muted border border-border'
                          : 'bg-bg3 border border-border text-text-muted hover:border-purple/40'
                      }`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {allAnswered && (
          <div className="px-6 pb-4">
            <p className="text-xs text-text-muted mb-2">הגופים הרלוונטיים לך:</p>
            <div className="flex flex-wrap gap-2">
              {BODY_ORDER.map(body => {
                const isRel = relevantBodies.has(body)
                const meta = bodies[body] ?? BODIES[body]
                return (
                  <span key={body}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isRel
                        ? `${meta.tint} ${meta.color} ${meta.ring}`
                        : 'bg-bg3 text-text-muted border-border opacity-40'
                    }`}>
                    {isRel ? '✓ ' : ''}{meta.label}
                  </span>
                )
              })}
            </div>
            {relevantBodies.size === 0 && (
              <p className="text-xs text-warning mt-2">לפי תשובותיך, ענה כן לפחות על שאלה אחת כדי לראות גופים רלוונטיים.</p>
            )}
          </div>
        )}

        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
            {allAnswered ? 'הבנתי — סגור' : 'סגור'}
          </button>
        </div>
      </div>
    </div>
  )
}
