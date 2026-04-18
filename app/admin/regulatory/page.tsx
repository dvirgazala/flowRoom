'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  fetchAllRules, verifyRule, updateRuleField, tableExists,
  isStale, formatVerifiedDate, BODY_ORDER_CONST, BODIES_FALLBACK,
  type RegulatoryRule,
} from '@/lib/regulatory'
import {
  ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Edit2,
  ExternalLink, ChevronRight, Database, Copy, Check,
} from 'lucide-react'

type KindLabel = Record<string, string>
const KIND_LABEL: KindLabel = {
  body_meta: 'מטא גוף',
  form_field: 'שדה טופס',
  rate: 'תעריף',
  deadline: 'דדליין',
}

const BODY_LABEL: Record<string, string> = {
  acum: 'אקו"ם',
  pil: 'הפיל',
  eshkolot: 'אשכולות',
  distributor: 'דיסטריביוטור',
  'youtube-cid': 'YouTube CID',
}

export default function RegulatoryAdminPage() {
  const router = useRouter()
  const [rules, setRules] = useState<RegulatoryRule[]>([])
  const [dbExists, setDbExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editBlurb, setEditBlurb] = useState('')
  const [editBy, setEditBy] = useState('')
  const [sqlCopied, setSqlCopied] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin-auth')) {
      router.replace('/admin')
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    const exists = await tableExists()
    setDbExists(exists)
    if (exists) {
      const data = await fetchAllRules()
      setRules(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const staleCount = rules.filter(r => isStale(r.last_verified_at)).length

  const handleVerify = async (id: string) => {
    setVerifying(id)
    const ok = await verifyRule(id, 'FlowRoom Admin')
    if (ok) {
      setRules(prev => prev.map(r =>
        r.id === id ? { ...r, last_verified_at: new Date().toISOString(), verified_by: 'FlowRoom Admin' } : r
      ))
    }
    setVerifying(null)
  }

  const openEdit = (rule: RegulatoryRule) => {
    const j = rule.content_json as Record<string, string>
    setEditId(rule.id)
    setEditLabel(rule.label ?? '')
    setEditUrl(rule.source_url ?? '')
    setEditBlurb(j.blurb ?? '')
    setEditBy('FlowRoom Admin')
  }

  const handleSaveEdit = async () => {
    if (!editId) return
    const rule = rules.find(r => r.id === editId)
    if (!rule) return
    const newContent = { ...rule.content_json, blurb: editBlurb }
    const ok = await updateRuleField(editId, {
      label: editLabel,
      source_url: editUrl,
      content_json: newContent,
      verified_by: editBy,
    })
    if (ok) {
      setRules(prev => prev.map(r =>
        r.id === editId ? {
          ...r, label: editLabel, source_url: editUrl,
          content_json: newContent, verified_by: editBy,
          last_verified_at: new Date().toISOString(),
          version: r.version + 1,
        } : r
      ))
    }
    setEditId(null)
  }

  const copySQL = async () => {
    try {
      const res = await fetch('/supabase/regulatory_rules.sql')
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 2000)
    } catch {
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 2000)
    }
  }

  const filtered = filter === 'all'
    ? rules
    : filter === 'stale'
      ? rules.filter(r => isStale(r.last_verified_at))
      : rules.filter(r => r.body === filter)

  return (
    <div className="min-h-screen bg-bg0 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 text-text-muted text-sm mb-6">
          <Link href="/admin/dashboard" className="hover:text-text-primary transition-colors">אדמין</Link>
          <ChevronRight size={14} />
          <span className="text-text-primary">תוכן רגולטורי</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} className="text-purple" />
              <h1 className="text-xl font-bold">ניהול תוכן רגולטורי</h1>
            </div>
            <p className="text-text-secondary text-sm">
              מידע על גופי זכויות, תעריפים ודדליינים — מה שמוצג למוזיקאים בFlowRoom. עדכן כאן כשמשהו משתנה בעולם האמיתי.
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-2 px-3 py-2 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
            <RefreshCw size={14} />
            רענן
          </button>
        </div>

        {/* DB not found */}
        {dbExists === false && (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Database size={20} className="text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-warning mb-1">טבלת regulatory_rules לא קיימת ב-Supabase</p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  כרגע האתר משתמש בנתונים hardcoded. כדי להפעיל את המערכת החיה, הפעל את ה-SQL הבא ב-Supabase:
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Supabase Dashboard → SQL Editor → New query → הדבק את הקוד ולחץ Run
                </p>
              </div>
            </div>
            <div className="bg-bg0 rounded-xl border border-border p-4 mb-3">
              <p className="text-xs font-mono text-text-muted leading-relaxed">
                -- הקובץ המלא נמצא ב-<strong className="text-text-primary">supabase/regulatory_rules.sql</strong> בפרויקט<br />
                -- מכיל יצירת טבלה + RLS + seed data לכל 5 הגופים + תעריפים + דדליינים
              </p>
            </div>
            <button onClick={copySQL}
              className="flex items-center gap-2 px-4 py-2 bg-warning/20 border border-warning/40 text-warning rounded-xl text-sm font-medium hover:bg-warning/30 transition-colors">
              {sqlCopied ? <><Check size={14} /> הועתק!</> : <><Copy size={14} /> העתק נתיב SQL</>}
            </button>
          </div>
        )}

        {/* Stats */}
        {dbExists && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-bg1 rounded-2xl shadow-surface p-4 text-center">
              <p className="text-2xl font-bold text-purple">{rules.length}</p>
              <p className="text-xs text-text-muted mt-1">כללים סה״כ</p>
            </div>
            <div className={`bg-bg1 rounded-2xl shadow-surface p-4 text-center ${staleCount > 0 ? 'ring-1 ring-warning/30' : ''}`}>
              <p className={`text-2xl font-bold ${staleCount > 0 ? 'text-warning' : 'text-success'}`}>{staleCount}</p>
              <p className="text-xs text-text-muted mt-1">ישנים (מעל 30 יום)</p>
            </div>
            <div className="bg-bg1 rounded-2xl shadow-surface p-4 text-center">
              <p className="text-2xl font-bold text-success">{rules.length - staleCount}</p>
              <p className="text-xs text-text-muted mt-1">מעודכנים</p>
            </div>
          </div>
        )}

        {/* Stale warning banner */}
        {staleCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl mb-6">
            <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-warning font-semibold">{staleCount} כללים לא אומתו מעל 30 יום</p>
              <p className="text-xs text-text-muted mt-0.5">בדוק כל אחד מול האתר הרשמי ולחץ "אמת כעת" אחרי שאישרת שהמידע נכון.</p>
            </div>
          </div>
        )}

        {/* Filter bar */}
        {dbExists && rules.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {['all', 'stale', ...BODY_ORDER_CONST].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-purple text-white' : 'bg-bg3 text-text-secondary hover:text-text-primary border border-border'
                }`}>
                {f === 'all' ? `הכל (${rules.length})` :
                 f === 'stale' ? `ישנים (${staleCount})` :
                 BODY_LABEL[f] ?? f}
              </button>
            ))}
          </div>
        )}

        {/* Rules table */}
        {loading ? (
          <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
            <RefreshCw size={24} className="text-text-muted mx-auto mb-3 animate-spin" />
            <p className="text-text-muted text-sm">טוען נתונים מ-Supabase...</p>
          </div>
        ) : dbExists && filtered.length > 0 ? (
          <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map(rule => {
                const stale = isStale(rule.last_verified_at)
                const j = rule.content_json as Record<string, string>
                return (
                  <div key={rule.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold">{rule.label ?? rule.body}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg3 border border-border text-text-muted">
                            {BODY_LABEL[rule.body] ?? rule.body}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple/10 border border-purple/30 text-purple">
                            {KIND_LABEL[rule.kind] ?? rule.kind}
                          </span>
                          <span className="text-[10px] text-text-muted">v{rule.version}</span>
                        </div>
                        {j.blurb && <p className="text-xs text-text-secondary leading-relaxed mb-2 line-clamp-2">{j.blurb}</p>}
                        <div className="flex items-center gap-3 text-[11px] flex-wrap">
                          {rule.source_url && (
                            <a href={rule.source_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-info hover:underline">
                              <ExternalLink size={10} />
                              {rule.source_url.replace('https://', '').split('/')[0]}
                            </a>
                          )}
                          <span className={`flex items-center gap-1 ${stale ? 'text-warning' : 'text-success'}`}>
                            {stale ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                            {stale ? 'ישן — ' : 'אומת: '}
                            {formatVerifiedDate(rule.last_verified_at)}
                          </span>
                          <span className="text-text-muted">ע״י {rule.verified_by}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => openEdit(rule)}
                          className="p-2 rounded-lg bg-bg3 border border-border text-text-muted hover:text-text-primary hover:border-purple/40 transition-all"
                          title="ערוך">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleVerify(rule.id)}
                          disabled={verifying === rule.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            stale
                              ? 'bg-warning/15 border border-warning/40 text-warning hover:bg-warning/25'
                              : 'bg-success/10 border border-success/30 text-success hover:bg-success/20'
                          }`}>
                          <RefreshCw size={11} className={verifying === rule.id ? 'animate-spin' : ''} />
                          {verifying === rule.id ? 'מאמת...' : 'אמת כעת'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : dbExists ? (
          <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
            <ShieldCheck size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">אין כללים תואמים לפילטר הנוכחי</p>
          </div>
        ) : null}

        {/* Fallback data preview */}
        {!dbExists && (
          <div className="mt-6 bg-bg1 rounded-2xl shadow-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">נתוני fallback — מה מוצג כרגע</p>
              <p className="text-xs text-text-muted mt-0.5">אלה הנתונים הקשיחים שמוצגים עד שהטבלה תופעל</p>
            </div>
            <div className="divide-y divide-border">
              {BODY_ORDER_CONST.map(body => {
                const meta = BODIES_FALLBACK[body]
                const stale = meta.lastVerifiedAt ? isStale(meta.lastVerifiedAt) : false
                return (
                  <div key={body} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                        <span className="text-[10px] text-text-muted">{meta.relevantSplit}</span>
                      </div>
                      <p className="text-xs text-text-muted">{meta.blurb.slice(0, 80)}...</p>
                    </div>
                    <span className={`text-[11px] flex items-center gap-1 ${stale ? 'text-warning' : 'text-success'}`}>
                      {stale ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                      {meta.lastVerifiedAt ? formatVerifiedDate(meta.lastVerifiedAt) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditId(null)}>
          <div className="bg-bg1 rounded-2xl p-6 w-full max-w-lg shadow-surface-lg" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold mb-4">עריכת כלל רגולטורי</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-text-muted mb-1 block">תווית (Label)</label>
                <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">כתובת URL של מקור</label>
                <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">הסבר (Blurb) — מה שמוצג למשתמש</label>
                <textarea value={editBlurb} onChange={e => setEditBlurb(e.target.value)} rows={3}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">עודכן על-ידי</label>
                <input value={editBy} onChange={e => setEditBy(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveEdit}
                className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                שמור ואמת
              </button>
              <button onClick={() => setEditId(null)}
                className="flex-1 py-3 bg-bg3 rounded-xl text-sm text-text-secondary border border-border hover:text-text-primary transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
