'use client'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getUserById } from '@/lib/data'
import type { RegistrationBody, RegistrationStatus, SplitSheet } from '@/lib/types'
import { fetchBodiesMeta, BODIES_FALLBACK, isStale, formatVerifiedDate, type BodyMeta } from '@/lib/regulatory'
import RegistrationModal from '@/components/RegistrationModal'
import {
  ShieldCheck, CheckCircle2, AlertCircle, Clock, XCircle, ArrowUpRight,
  Music2, FileText, Lock, Zap, TrendingUp, HelpCircle, Wallet, RefreshCw,
} from 'lucide-react'

// BODIES is re-exported from the fallback so earnings/page.tsx and RegistrationModal keep working.
// RightsPage component augments this with live DB data at runtime.
export const BODIES = BODIES_FALLBACK
export const BODY_ORDER: RegistrationBody[] = ['acum', 'pil', 'eshkolot', 'distributor', 'youtube-cid']

const STATUS_META: Record<RegistrationStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  registered: { label: 'רשום', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/30' },
  pending: { label: 'הוגש', icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  rejected: { label: 'נדחה', icon: XCircle, color: 'text-danger', bg: 'bg-danger/10 border-danger/30' },
  not_registered: { label: 'חסר', icon: AlertCircle, color: 'text-text-muted', bg: 'bg-bg3 border-border' },
}

export default function RightsPage() {
  const { splitSheets, currentUser } = useStore()
  const [modal, setModal] = useState<{ sheetId: string; body: RegistrationBody; lastVerifiedAt?: string } | null>(null)
  const [bodies, setBodies] = useState<Record<RegistrationBody, BodyMeta>>(BODIES_FALLBACK)

  useEffect(() => {
    fetchBodiesMeta().then(setBodies)
  }, [])

  // Scope to sheets where the current user is a participant in any category.
  const mySheets = useMemo(() => {
    if (!currentUser) return splitSheets
    return splitSheets.filter(sh => {
      const all = [...sh.publishing, ...sh.master, ...sh.producer]
      return all.some(p => p.userId === currentUser.id) || sh.createdBy === currentUser.id
    })
  }, [splitSheets, currentUser])

  const stats = useMemo(() => {
    let totalSlots = 0
    let registered = 0
    let pending = 0
    let missing = 0
    mySheets.forEach(sh => {
      const regs = sh.registrations ?? []
      regs.forEach(r => {
        totalSlots++
        if (r.status === 'registered') registered++
        else if (r.status === 'pending') pending++
        else missing++
      })
    })
    return { totalSlots, registered, pending, missing, tracks: mySheets.length }
  }, [mySheets])

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
        <Link href="/earnings"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm flex-shrink-0">
          <Wallet size={15} />
          תיבת הכנסות
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="שירים פעילים" value={stats.tracks} icon={Music2} color="text-purple" />
        <StatCard label="רישומים פעילים" value={stats.registered} icon={CheckCircle2} color="text-success"
          hint={stats.totalSlots ? `${Math.round((stats.registered / stats.totalSlots) * 100)}% מהסך` : ''} />
        <StatCard label="ממתינים לאישור" value={stats.pending} icon={Clock} color="text-warning" />
        <StatCard label="חסרים — כסף על השולחן" value={stats.missing} icon={AlertCircle} color="text-danger"
          hint={stats.missing > 0 ? 'רישומים שלא בוצעו' : 'הכל מכוסה'} />
      </div>

      {/* Educational banner — how it works */}
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
              אנחנו לא מחליפים את אקו"ם, הפיל או DistroKid — אנחנו מוודאים שאתה לא שוכח אף אחד מהם.
              <strong className="text-text-primary"> כל רישום חסר = כסף שלא מגיע אליך.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {mySheets.length === 0 ? (
        <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
          <Music2 size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-1">עדיין אין שירים במעקב</p>
          <p className="text-text-muted text-xs mb-5">
            צור חדר חדש, סיים Split Sheet — והשיר יופיע כאן אוטומטית עם כל גוף שצריך לרשום בו.
          </p>
          <Link href="/rooms"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
            <ArrowUpRight size={15} />
            צור חדר חדש
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mySheets.map(sheet => (
            <TrackCard key={sheet.id} sheet={sheet} bodies={bodies}
              onOpenRegistration={(body) => setModal({ sheetId: sheet.id, body, lastVerifiedAt: bodies[body]?.lastVerifiedAt })} />
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
        </p>
      </div>

      {modal && (
        <RegistrationModal
          sheetId={modal.sheetId}
          body={modal.body}
          lastVerifiedAt={modal.lastVerifiedAt}
          onClose={() => setModal(null)}
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

/* ── Track card — one per split sheet ─────────────────────────────────── */
function TrackCard({ sheet, bodies, onOpenRegistration }: {
  sheet: SplitSheet
  bodies: Record<RegistrationBody, BodyMeta>
  onOpenRegistration: (body: RegistrationBody) => void
}) {
  const regs = sheet.registrations ?? []
  const locked = sheet.status === 'locked'
  const signed = [...sheet.publishing, ...sheet.master, ...sheet.producer].every(p => p.hasSigned)

  const registeredCount = regs.filter(r => r.status === 'registered').length
  const pct = BODY_ORDER.length > 0 ? Math.round((registeredCount / BODY_ORDER.length) * 100) : 0

  const writers = sheet.publishing.filter(p => p.sharePct > 0).map(p => getUserById(p.userId)?.name).filter(Boolean) as string[]

  return (
    <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Music2 size={15} className="text-purple flex-shrink-0" />
              <h3 className="font-semibold truncate">{sheet.trackTitle}</h3>
              {locked && (
                <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded">
                  <Lock size={10} /> Split נעול
                </span>
              )}
              {!locked && !signed && (
                <span className="inline-flex items-center gap-1 text-xs text-warning bg-warning/10 border border-warning/30 px-1.5 py-0.5 rounded">
                  <AlertCircle size={10} /> Split לא חתום
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
              {writers.length > 0 && <span>כותבים: {writers.slice(0, 3).join(', ')}{writers.length > 3 ? ` +${writers.length - 3}` : ''}</span>}
              {sheet.isrc && <span>· ISRC {sheet.isrc}</span>}
              {sheet.iswc && <span>· ISWC {sheet.iswc}</span>}
            </div>
          </div>
          <Link href={`/rooms/${sheet.roomId}/splits`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all flex-shrink-0">
            <FileText size={12} /> חוזה
          </Link>
        </div>

        {/* Completeness bar */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-1.5 bg-bg3 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-mono font-semibold text-text-secondary tabular-nums">{registeredCount}/{BODY_ORDER.length}</span>
          <TrendingUp size={11} className={pct === 100 ? 'text-success' : 'text-text-muted'} />
        </div>
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 pb-5">
        {BODY_ORDER.map(bodyKey => {
          const body = bodies[bodyKey] ?? BODIES[bodyKey]
          const reg = regs.find(r => r.body === bodyKey)
          const status = reg?.status ?? 'not_registered'
          const statusMeta = STATUS_META[status]
          const StatusIcon = statusMeta.icon

          const stale = body.lastVerifiedAt ? isStale(body.lastVerifiedAt) : false
          return (
            <button key={bodyKey} onClick={() => onOpenRegistration(bodyKey)}
              className={`text-right p-3 rounded-xl border transition-all hover:border-purple/50 hover:bg-bg3
                ${status === 'registered' ? 'border-success/30 bg-success/5' : 'border-border bg-bg1'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${body.color}`}>{body.label}</span>
                <div className="flex items-center gap-1">
                  {stale && <RefreshCw size={10} className="text-warning" aria-label="מידע לא עודכן מעל 30 יום" />}
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
