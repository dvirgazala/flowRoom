'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import type { EarningsSource, EarningsLine, Currency } from '@/lib/types'
import { BODIES, BODY_ORDER } from '../rights/page'
import {
  Wallet, Upload, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Music2, ChevronDown, ChevronLeft, Trash2, ArrowUpRight, Sparkles, Info,
} from 'lucide-react'

const USD_TO_ILS = 3.7

const SOURCE_META: Record<EarningsSource, { label: string; color: string; tint: string }> = {
  acum: { label: BODIES.acum.label, color: BODIES.acum.color, tint: BODIES.acum.tint },
  pil: { label: BODIES.pil.label, color: BODIES.pil.color, tint: BODIES.pil.tint },
  eshkolot: { label: BODIES.eshkolot.label, color: BODIES.eshkolot.color, tint: BODIES.eshkolot.tint },
  distributor: { label: BODIES.distributor.label, color: BODIES.distributor.color, tint: BODIES.distributor.tint },
  'youtube-cid': { label: BODIES['youtube-cid'].label, color: BODIES['youtube-cid'].color, tint: BODIES['youtube-cid'].tint },
  other: { label: 'אחר', color: 'text-text-secondary', tint: 'bg-bg3' },
}

const toILS = (amount: number, currency: Currency) => {
  if (currency === 'ILS') return amount
  if (currency === 'USD') return amount * USD_TO_ILS
  return amount * 4.0
}

const fmt = (amount: number, currency: Currency = 'ILS') => {
  const sym = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€'
  return `${sym}${amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`
}

const fmtILS = (amount: number) => `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`

export default function EarningsPage() {
  const { earningsLines, earningsBatches, splitSheets, currentUser, deleteEarningsBatch } = useStore()
  const [importOpen, setImportOpen] = useState(false)
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)

  // Scope to lines whose sheet the current user participates in (or unmatched lines).
  const myLines = useMemo(() => {
    if (!currentUser) return earningsLines
    const mySheetIds = new Set(
      splitSheets
        .filter(sh => {
          const all = [...sh.publishing, ...sh.master, ...sh.producer]
          return all.some(p => p.userId === currentUser.id) || sh.createdBy === currentUser.id
        })
        .map(sh => sh.id),
    )
    return earningsLines.filter(l => !l.sheetId || mySheetIds.has(l.sheetId))
  }, [earningsLines, splitSheets, currentUser])

  const myBatches = useMemo(() => {
    const batchIds = new Set(myLines.map(l => l.batchId))
    return earningsBatches.filter(b => batchIds.has(b.id))
  }, [earningsBatches, myLines])

  const stats = useMemo(() => {
    let totalILS = 0
    let receivedILS = 0
    let pendingILS = 0
    const trackSet = new Set<string>()
    myLines.forEach(l => {
      const ils = toILS(l.amount, l.currency)
      totalILS += ils
      if (l.payoutStatus === 'received') receivedILS += ils
      else pendingILS += ils
      trackSet.add(l.sheetId || l.trackTitle)
    })
    return { totalILS, receivedILS, pendingILS, trackCount: trackSet.size }
  }, [myLines])

  // Aggregate by source
  const bySource = useMemo(() => {
    const map = new Map<EarningsSource, number>()
    myLines.forEach(l => {
      const prev = map.get(l.source) || 0
      map.set(l.source, prev + toILS(l.amount, l.currency))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [myLines])

  // Aggregate by track
  const byTrack = useMemo(() => {
    const map = new Map<string, { title: string; sheetId?: string; lines: EarningsLine[]; total: number }>()
    myLines.forEach(l => {
      const key = l.sheetId || `__${l.trackTitle}`
      const entry = map.get(key) || { title: l.trackTitle, sheetId: l.sheetId, lines: [], total: 0 }
      entry.lines.push(l)
      entry.total += toILS(l.amount, l.currency)
      map.set(key, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [myLines])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={18} className="text-purple" />
        <span className="text-xs text-purple font-semibold">Earnings Inbox · FlowRoom</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold">תיבת הכנסות</h1>
          <p className="text-text-secondary text-sm mt-1 max-w-xl">
            כל תשלום מאקו"ם, הפיל, אשכולות, מפיצים ו-YouTube — במקום אחד. רואים מה נכנס, מה ממתין, וממי.
          </p>
        </div>
        <button onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
          <Upload size={15} />
          ייבוא דוח
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="סה״כ שנתי" value={fmtILS(stats.totalILS)} icon={TrendingUp} color="text-purple" />
        <StatCard label="התקבל" value={fmtILS(stats.receivedILS)} icon={CheckCircle2} color="text-success" />
        <StatCard label="ממתין לתשלום" value={fmtILS(stats.pendingILS)} icon={Clock} color="text-warning" />
        <StatCard label="טראקים מרוויחים" value={stats.trackCount} icon={Music2} color="text-pink" />
      </div>

      {myLines.length === 0 ? (
        <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
          <Wallet size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-1">אין עדיין דוחות מיובאים</p>
          <p className="text-text-muted text-xs mb-5 max-w-md mx-auto leading-relaxed">
            ייבא דוח תשלומים מאקו"ם, הפיל או כל מפיץ דיגיטלי — ואנחנו נשייך כל שורה לשיר המתאים אצלך.
            {splitSheets.length === 0 && ' (מומלץ לסיים Split Sheet קודם כדי שנוכל לשייך את השורות.)'}
          </p>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <button onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
              <Upload size={15} />
              ייבוא דוח ראשון
            </button>
            {splitSheets.length === 0 && (
              <Link href="/rooms"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary border border-border transition-colors">
                צור Split Sheet
                <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Per-source breakdown */}
          <div className="bg-bg1 rounded-2xl shadow-surface p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">פירוט לפי מקור</h2>
              <span className="text-xs text-text-muted">{fmtILS(stats.totalILS)} סה״כ</span>
            </div>
            <div className="space-y-2.5">
              {bySource.map(([source, amount]) => {
                const pct = stats.totalILS > 0 ? (amount / stats.totalILS) * 100 : 0
                const meta = SOURCE_META[source]
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-text-secondary">{fmtILS(amount)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${meta.tint.replace('bg-', 'bg-').replace('/10', '')} ${meta.color.replace('text-', 'bg-')}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-track breakdown */}
          <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">פירוט לפי שיר</h2>
              <p className="text-text-muted text-xs mt-0.5">לחץ על שיר לראות את כל שורות ההכנסה שלו</p>
            </div>
            <div className="divide-y divide-border">
              {byTrack.map((track, idx) => {
                const key = track.sheetId || `__${track.title}-${idx}`
                const expanded = expandedTrack === key
                return (
                  <div key={key}>
                    <button onClick={() => setExpandedTrack(expanded ? null : key)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-bg3/40 transition-colors text-right">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Music2 size={13} className="text-text-muted flex-shrink-0" />
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          {!track.sheetId && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 flex-shrink-0">
                              לא משויך
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{track.lines.length} שורות תשלום</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-purple">{fmtILS(track.total)}</p>
                      </div>
                      <ChevronDown size={15} className={`text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && (
                      <div className="bg-bg0/40 px-5 py-3 border-t border-border">
                        <div className="space-y-2">
                          {track.lines.map(l => {
                            const meta = SOURCE_META[l.source]
                            return (
                              <div key={l.id} className="flex items-center gap-3 p-2.5 bg-bg1 rounded-lg border border-border">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.tint} ${meta.color} font-medium`}>
                                  {meta.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-text-primary truncate">{l.platform}</span>
                                    {l.territory && <span className="text-text-muted">· {l.territory}</span>}
                                    {l.units && <span className="text-text-muted">· {l.units.toLocaleString('he-IL')} יח׳</span>}
                                  </div>
                                  <p className="text-[10px] text-text-muted mt-0.5">תקופה: {l.period}</p>
                                </div>
                                <div className="text-left flex-shrink-0">
                                  <p className="text-sm font-semibold text-text-primary">{fmt(l.amount, l.currency)}</p>
                                  <p className={`text-[10px] ${l.payoutStatus === 'received' ? 'text-success' : 'text-warning'}`}>
                                    {l.payoutStatus === 'received' ? '✓ התקבל' : '⏳ ממתין'}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {track.sheetId && (
                          <Link href={`/rights`}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-purple hover:underline">
                            צפה בזכויות של השיר
                            <ChevronLeft size={12} />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Batches list */}
          <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">דוחות שיובאו</h2>
              <p className="text-text-muted text-xs mt-0.5">קובצי מקור שהועלו למערכת</p>
            </div>
            <div className="divide-y divide-border">
              {myBatches.map(batch => {
                const meta = SOURCE_META[batch.source]
                return (
                  <div key={batch.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-9 h-9 rounded-lg ${meta.tint} flex items-center justify-center flex-shrink-0`}>
                      <FileText size={15} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate">{batch.filename}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.tint} ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        {batch.uploadedAt} · {batch.lineCount} שורות · {batch.matchedCount}/{batch.lineCount} שויכו
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="font-semibold text-sm text-purple">{fmt(batch.totalAmount, batch.currency)}</p>
                    </div>
                    <button onClick={() => deleteEarningsBatch(batch.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                      aria-label="מחק דוח">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer tip */}
      <div className="mt-6 flex items-start gap-2 p-4 bg-bg1 rounded-2xl shadow-surface">
        <Info size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-primary">טיפ:</strong> המערכת משייכת כל שורת תשלום אוטומטית לשיר לפי כותרת ו-ISRC/ISWC.
          שורות שלא זוהו מסומנות "לא משויך" — עדכן את ה-Split Sheet הרלוונטי ועשה ייבוא מחדש.
          שערי המרה: 1 USD ≈ 3.7 ₪.
        </p>
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: typeof TrendingUp; color: string
}) {
  return (
    <div className="bg-bg1 rounded-2xl shadow-surface p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { importEarnings } = useStore()
  const [source, setSource] = useState<EarningsSource>('acum')
  const [filename, setFilename] = useState('')
  const [busy, setBusy] = useState(false)

  const defaultNames: Record<EarningsSource, string> = {
    acum: 'acum_statement_2026_Q1.csv',
    pil: 'pil_royalties_2026_Q1.pdf',
    eshkolot: 'eshkolot_2026_Q1.xlsx',
    distributor: 'distrokid_earnings_mar_2026.csv',
    'youtube-cid': 'youtube_cid_mar_2026.csv',
    other: 'royalty_report.csv',
  }

  const handleImport = () => {
    const name = filename.trim() || defaultNames[source]
    setBusy(true)
    setTimeout(() => {
      importEarnings(source, name)
      setBusy(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}>
      <div className="bg-bg1 rounded-2xl p-6 w-full max-w-md shadow-surface-lg modal-card max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Upload size={16} className="text-purple" />
          <h2 className="text-lg font-bold">ייבוא דוח תשלומים</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">
          בחר את הגוף שממנו הגיע הדוח. המערכת תפרסר את הקובץ ותשייך כל שורה לשיר המתאים.
        </p>

        <label className="block text-xs text-text-secondary mb-2">מקור הדוח</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {BODY_ORDER.map(body => {
            const m = BODIES[body]
            const active = source === body
            return (
              <button key={body} onClick={() => setSource(body)}
                className={`p-3 rounded-xl border text-right transition-all ${
                  active ? `${m.tint} ${m.ring} ring-2 ring-offset-0` : 'bg-bg3 border-border hover:border-text-muted'
                }`}
                style={active ? { boxShadow: '0 0 0 2px rgba(168,85,247,0.25)' } : undefined}>
                <p className={`text-sm font-semibold ${active ? m.color : 'text-text-primary'}`}>{m.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">{m.short}</p>
              </button>
            )
          })}
          <button onClick={() => setSource('other')}
            className={`p-3 rounded-xl border text-right transition-all col-span-2 ${
              source === 'other' ? 'bg-bg3 border-purple ring-2 ring-purple/30' : 'bg-bg3 border-border hover:border-text-muted'
            }`}>
            <p className="text-sm font-semibold text-text-primary">אחר / דוח ידני</p>
            <p className="text-[10px] text-text-muted mt-0.5">מקור שאינו ברשימה</p>
          </button>
        </div>

        <label className="block text-xs text-text-secondary mb-2">שם הקובץ</label>
        <input value={filename} onChange={e => setFilename(e.target.value)}
          placeholder={defaultNames[source]}
          className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple mb-1" />
        <p className="text-[11px] text-text-muted mb-5 leading-relaxed">
          <Sparkles size={10} className="inline text-purple mx-0.5" />
          במצב דמו — לחיצה על "ייבוא" מדמה ניתוח של הקובץ ומייצרת שורות מציאותיות מהשירים שלך.
        </p>

        <div className="flex gap-3">
          <button onClick={handleImport} disabled={busy}
            className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2">
            {busy ? 'מנתח קובץ...' : <><Upload size={14} />ייבוא</>}
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 bg-bg3 rounded-xl text-sm text-text-secondary hover:text-text-primary border border-border transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
