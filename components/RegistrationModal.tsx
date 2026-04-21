'use client'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { RegistrationBody } from '@/lib/types'
import type { FullSplitSheet } from '@/lib/supabase-types'
import { BODIES } from '@/app/(main)/rights/page'
import { formatVerifiedDate, isStale } from '@/lib/regulatory'
import { submitSplitRegistration, markSplitRegistered, resetSplitRegistration } from '@/lib/db'
import {
  X, Copy, ExternalLink, CheckCircle2, Clock, AlertCircle, RotateCcw,
  ShieldCheck, Info, ArrowUpRight, RefreshCw,
} from 'lucide-react'

type FieldRow = { label: string; value: string; mono?: boolean }

function buildFields(body: RegistrationBody, sheet: FullSplitSheet): FieldRow[] {
  const publishingParts = sheet.participants.filter(p => p.category === 'publishing' && Number(p.share_pct) > 0)
  const masterParts     = sheet.participants.filter(p => p.category === 'master')
  const producerParts   = sheet.participants.filter(p => p.category === 'producer')

  const writerLine = (p: typeof publishingParts[0]) =>
    `${p.profile.display_name} — ${Number(p.share_pct)}%${p.role ? ` (${p.role})` : ''}`

  const fields: FieldRow[] = [{ label: 'שם היצירה', value: sheet.track_title }]

  switch (body) {
    case 'acum':
      if (sheet.iswc) fields.push({ label: 'ISWC', value: sheet.iswc, mono: true })
      fields.push({
        label: 'כותבים / מלחינים',
        value: publishingParts.map(writerLine).join('\n') || '—',
      })
      fields.push({
        label: 'סיכום פבלישינג',
        value: `${publishingParts.reduce((s, p) => s + Number(p.share_pct), 0)}% = ${publishingParts.length} כותבים`,
      })
      break
    case 'pil':
      if (sheet.isrc) fields.push({ label: 'ISRC', value: sheet.isrc, mono: true })
      fields.push({
        label: 'בעלי מאסטר',
        value: masterParts.filter(p => p.role === 'owner' || p.role === 'label').map(writerLine).join('\n')
             || masterParts.map(writerLine).join('\n') || '—',
      })
      break
    case 'eshkolot':
      if (sheet.isrc) fields.push({ label: 'ISRC', value: sheet.isrc, mono: true })
      fields.push({
        label: 'אמנים מבצעים',
        value: masterParts.filter(p => p.role === 'performer' || p.role === 'featured').map(writerLine).join('\n')
             || masterParts.map(writerLine).join('\n') || '—',
      })
      break
    case 'distributor': {
      if (sheet.isrc) fields.push({ label: 'ISRC', value: sheet.isrc, mono: true })
      const mainArtist = masterParts[0]?.profile.display_name ?? '—'
      fields.push({ label: 'אמן ראשי', value: mainArtist })
      const featured = masterParts.filter(p => p.role === 'featured').map(p => p.profile.display_name)
      if (featured.length > 0) fields.push({ label: 'Featured', value: featured.join(', ') })
      fields.push({ label: 'קרדיטים למפיק', value: producerParts.map(writerLine).join('\n') || '—' })
      break
    }
    case 'youtube-cid':
      if (sheet.isrc) fields.push({ label: 'ISRC', value: sheet.isrc, mono: true })
      fields.push({
        label: 'בעלי זכויות (Claim Holders)',
        value: masterParts.filter(p => Number(p.share_pct) > 0).map(writerLine).join('\n') || '—',
      })
      break
  }
  return fields
}

export default function RegistrationModal({ sheetId, body, lastVerifiedAt, onClose, sheet: sheetProp }: {
  sheetId: string
  body: RegistrationBody
  lastVerifiedAt?: string
  onClose: () => void
  sheet?: FullSplitSheet
}) {
  const { showToast } = useStore()
  const [reference, setReference] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const meta = BODIES[body]

  // Accept sheet either from prop (when caller already has it) or via store fallback
  const sheet = sheetProp ?? null
  const reg = sheet?.registrations?.find(r => r.body === body)
  const status = reg?.status ?? 'not_registered'
  const splitLocked = sheet?.status === 'locked'

  const fields = useMemo(() => sheet ? buildFields(body, sheet) : [], [body, sheet])

  if (!sheet) return null

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      showToast('לא הצלחנו להעתיק', 'error')
    }
  }

  const copyAll = () => {
    const text = fields.map(f => `${f.label}:\n${f.value}`).join('\n\n')
    copy(text, 'all')
    showToast('הכל הועתק — הדבק בטופס של ' + meta.label, 'success')
  }

  const handleSubmit = async () => {
    if (!splitLocked) {
      showToast('חתום על ה-Split Sheet לפני סימון רישום', 'error')
      return
    }
    setSaving(true)
    await submitSplitRegistration(sheetId, body)
    showToast('סומן כהוגש — נעדכן כשהרישום יאושר', 'info')
    setSaving(false)
    onClose()
  }

  const handleMarkRegistered = async () => {
    if (!reference.trim()) {
      showToast('הוסף את מספר הרישום שקיבלת', 'error')
      return
    }
    setSaving(true)
    await markSplitRegistered(sheetId, body, reference.trim())
    showToast('הרישום אושר!', 'success')
    setSaving(false)
    onClose()
  }

  const handleReset = async () => {
    setSaving(true)
    await resetSplitRegistration(sheetId, body)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden modal-card flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.tint} border ${meta.ring} flex-shrink-0`}>
              <ShieldCheck size={18} className={meta.color} />
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{meta.label}</p>
              <p className="text-xs text-text-muted truncate">{meta.short} · {sheet.track_title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Blurb */}
          <div className="px-6 py-4 bg-bg2/40 border-b border-border">
            <div className="flex items-start gap-2">
              <Info size={14} className={`${meta.color} mt-0.5 flex-shrink-0`} />
              <p className="text-xs text-text-secondary leading-relaxed">{meta.blurb}</p>
            </div>
          </div>

          {/* Status block */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-xs text-text-muted mb-2">סטטוס נוכחי</p>
            {status === 'registered' && reg && (
              <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/30 rounded-xl">
                <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-success font-semibold text-sm">רשום ב{meta.label}</p>
                  {reg.reference && <p className="text-xs text-success/80 font-mono mt-0.5">מספר רישום: {reg.reference}</p>}
                  {reg.registered_at && <p className="text-xs text-success/60 mt-0.5">אושר: {new Date(reg.registered_at).toLocaleDateString('he-IL')}</p>}
                </div>
                <button onClick={handleReset} disabled={saving}
                  className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-all">
                  <RotateCcw size={13} />
                </button>
              </div>
            )}
            {status === 'pending' && reg && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <Clock size={16} className="text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-warning font-semibold text-sm">הוגש לרישום — ממתין לאישור</p>
                    {reg.submitted_at && <p className="text-xs text-warning/70 mt-0.5">הוגש: {new Date(reg.submitted_at).toLocaleDateString('he-IL')}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input value={reference} onChange={e => setReference(e.target.value)}
                    placeholder="מספר רישום / work code"
                    className="flex-1 bg-bg3 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple" />
                  <button onClick={handleMarkRegistered} disabled={saving}
                    className="px-3 py-2 bg-success/15 border border-success/40 text-success rounded-lg text-xs font-semibold hover:bg-success/25 transition-all disabled:opacity-50">
                    {saving ? '...' : 'סמן כרשום'}
                  </button>
                </div>
              </div>
            )}
            {status === 'not_registered' && (
              <div className="flex items-start gap-3 p-3 bg-bg3 border border-border rounded-xl">
                <AlertCircle size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text-secondary">
                  עדיין לא רשום. זה אומר שכל הכנסה מ{meta.label} — לא מגיעה אליך.
                </p>
              </div>
            )}
            {!splitLocked && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded-xl">
                <AlertCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />
                <p className="text-xs text-danger">
                  ה-Split Sheet עדיין לא נעול. חייבים חתימה של כל הצדדים לפני הגשה לכל גוף חיצוני.
                </p>
              </div>
            )}
          </div>

          {/* Pre-filled fields */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-muted">נתונים מוכנים למילוי</p>
              <button onClick={copyAll}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
                <Copy size={11} />
                {copied === 'all' ? 'הועתק!' : 'העתק הכל'}
              </button>
            </div>
            <div className="space-y-2.5">
              {fields.map((f, i) => (
                <div key={i} className="bg-bg3 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs text-text-muted">{f.label}</span>
                    <button onClick={() => copy(f.value, f.label)}
                      className="p-1 text-text-muted hover:text-purple rounded transition-colors flex-shrink-0">
                      <Copy size={11} />
                    </button>
                  </div>
                  <p className={`text-sm text-text-primary whitespace-pre-line ${f.mono ? 'font-mono' : ''}`}>
                    {copied === f.label ? <span className="text-success">✓ הועתק</span> : f.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg2/40 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <a href={meta.url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
              <ExternalLink size={14} />פתח את {meta.label}<ArrowUpRight size={12} />
            </a>
            {status === 'not_registered' && (
              <button onClick={handleSubmit} disabled={!splitLocked || saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm">
                <CheckCircle2 size={14} />
                {saving ? '...' : 'סמן כהוגש'}
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted text-center mt-3">
            העתק את הנתונים, פתח את {meta.label} בלשונית חדשה, הדבק בטופס — ואז חזור לסמן שהוגש.
          </p>
          {lastVerifiedAt && (
            <div className={`flex items-center justify-center gap-1.5 mt-2 text-[11px] ${isStale(lastVerifiedAt) ? 'text-warning' : 'text-text-muted'}`}>
              <RefreshCw size={10} />
              {isStale(lastVerifiedAt)
                ? 'מידע זה לא אומת מעל 30 יום — בדוק מול האתר הרשמי'
                : `אומת: ${formatVerifiedDate(lastVerifiedAt)}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
