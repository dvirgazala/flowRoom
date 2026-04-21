'use client'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import Avatar from '@/components/Avatar'
import { profileToUser } from '@/lib/profile-utils'
import type { SplitCategory, SplitRole, PublishingRole, MasterRole, ProducerRole } from '@/lib/types'
import type { DbProfile, DbSplitParticipant, FullSplitSheet } from '@/lib/supabase-types'
import {
  getOrCreateSplitSheet, getSplitSheet, updateSplitSheetMeta,
  upsertSplitParticipants, signSplitSheet, notifySplitLocked,
  getRoomById, getRoomMembers, searchProfiles,
} from '@/lib/db'
import {
  ArrowLeft, ChevronRight, PenLine, CheckCircle2, AlertCircle, Sliders,
  FileText, Info, Music2, Disc3, Headphones, Plus, Trash2, Printer, Lock,
  BadgeCheck, ShieldCheck, Search,
} from 'lucide-react'

const CATEGORY_META: Record<SplitCategory, {
  label: string; sublabel: string; body: string; bodyColor: string
  icon: typeof Music2; description: string
  roles: { value: SplitRole; label: string }[]
}> = {
  publishing: {
    label: 'זכויות יוצר', sublabel: 'Publishing · מילים + לחן', body: 'אקו"ם (ACUM)', bodyColor: 'text-purple',
    icon: Music2,
    description: 'למי שכתב את המילים והלחין את השיר. גובה ביצוע ציבורי (רדיו, לייב, שידור) + תמלוגי שכפול (סטרימינג).',
    roles: [
      { value: 'lyrics' as PublishingRole, label: 'מילים' },
      { value: 'composition' as PublishingRole, label: 'לחן' },
      { value: 'arrangement' as PublishingRole, label: 'עיבוד' },
    ],
  },
  master: {
    label: 'זכויות מאסטר', sublabel: 'Master · ההקלטה', body: 'הפיל / אשכולות', bodyColor: 'text-pink',
    icon: Disc3,
    description: 'מי בעל ההקלטה עצמה — מייצג את מבצעי השיר ובעל ההקלטה. גובה תמלוגי שידור, זכויות שכנות, סינכרון.',
    roles: [
      { value: 'performer' as MasterRole, label: 'מבצע/ת' },
      { value: 'featured' as MasterRole, label: 'פיצ\'רינג' },
      { value: 'owner' as MasterRole, label: 'בעל מאסטר' },
      { value: 'label' as MasterRole, label: 'ליבל' },
    ],
  },
  producer: {
    label: 'נקודות מפיק', sublabel: 'Producer Points · חלק מהמאסטר', body: 'חוזה ישיר', bodyColor: 'text-warning',
    icon: Headphones,
    description: 'נקודות המפיק — אחוז שנגזר מהמאסטר ומיועד למפיק/ים. לרוב 2-5 נקודות, מוסכם בחוזה פרטי.',
    roles: [
      { value: 'producer' as ProducerRole, label: 'מפיק/ה' },
      { value: 'co-producer' as ProducerRole, label: 'מפיק/ה שותף' },
      { value: 'engineer' as ProducerRole, label: 'סאונד אנג\'ינר' },
    ],
  },
}

const CATEGORIES: SplitCategory[] = ['publishing', 'master', 'producer']

type DraftRow = { user_id: string; share_pct: number; role: string; profile: DbProfile }

export default function SplitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentUser, showToast } = useStore()

  const [sheet, setSheet] = useState<FullSplitSheet | null>(null)
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [activeCat, setActiveCat] = useState<SplitCategory>('publishing')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<DraftRow[] | null>(null)
  const [metaEdit, setMetaEdit] = useState<{ trackTitle: string; isrc: string; iswc: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DbProfile[]>([])

  const load = useCallback(async () => {
    const [room, sh] = await Promise.all([getRoomById(id), getOrCreateSplitSheet(id, 'שיר ללא שם')])
    setRoomName(room?.name ?? '')
    setSheet(sh)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const catParticipants = useMemo(() => {
    if (!sheet) return []
    return sheet.participants.filter(p => p.category === activeCat)
  }, [sheet, activeCat])

  const total = useMemo(() =>
    (editing && draft ? draft : catParticipants).reduce((s, p) => s + Number(p.share_pct), 0),
    [editing, draft, catParticipants],
  )

  const all100 = useMemo(() => {
    if (!sheet) return false
    return CATEGORIES.every(cat => {
      const sum = sheet.participants.filter(p => p.category === cat).reduce((s, p) => s + Number(p.share_pct), 0)
      return Math.round(sum) === 100
    })
  }, [sheet])

  const allSigned = useMemo(() => {
    if (!sheet) return false
    return sheet.participants.every(p => p.has_signed)
  }, [sheet])

  const locked = sheet?.status === 'locked'

  // Search for profiles to add
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const results = await searchProfiles(searchQuery, 8)
      const existingIds = new Set((draft ?? catParticipants).map(p => p.user_id))
      setSearchResults(results.filter(r => !existingIds.has(r.id)))
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, draft, catParticipants])

  const startEditing = () => {
    setDraft(catParticipants.map(p => ({
      user_id: p.user_id, share_pct: Number(p.share_pct), role: p.role ?? '', profile: p.profile,
    })))
    setEditing(true)
  }
  const cancelEditing = () => { setDraft(null); setEditing(false); setSearchQuery(''); setSearchResults([]) }

  const updateDraft = (userId: string, patch: Partial<DraftRow>) => {
    setDraft(prev => prev ? prev.map(p => p.user_id === userId ? { ...p, ...patch } : p) : prev)
  }
  const removeDraft = (userId: string) => {
    setDraft(prev => prev ? prev.filter(p => p.user_id !== userId) : prev)
  }
  const addDraftParticipant = (profile: DbProfile) => {
    if (!draft) return
    const defaultRole = CATEGORY_META[activeCat].roles[0].value
    setDraft([...draft, { user_id: profile.id, share_pct: 0, role: defaultRole as string, profile }])
    setSearchQuery(''); setSearchResults([])
  }

  const saveDraft = async () => {
    if (!draft || !sheet) return
    const newTotal = draft.reduce((s, p) => s + p.share_pct, 0)
    if (Math.round(newTotal) !== 100) {
      showToast(`סך ${CATEGORY_META[activeCat].label} חייב להיות 100% (כרגע ${Math.round(newTotal)}%)`, 'error')
      return
    }
    setSaving(true)
    await upsertSplitParticipants(sheet.id, activeCat, draft.map(p => ({ user_id: p.user_id, share_pct: p.share_pct, role: p.role })))
    setEditing(false); setDraft(null)
    showToast('החלוקה עודכנה', 'success')
    await load()
    setSaving(false)
  }

  const handleSign = async () => {
    if (!currentUser || !sheet) return
    if (!all100) {
      showToast('כל הקטגוריות חייבות להסתכם ב־100% לפני חתימה', 'error')
      return
    }
    setSaving(true)
    const justLocked = await signSplitSheet(sheet.id)
    if (justLocked) {
      await notifySplitLocked(sheet.id, sheet.track_title)
      showToast('ה-Split Sheet נעול! נשלחו התראות לכל המשתתפים', 'success')
    } else {
      showToast('חתמת על ה-Split Sheet', 'success')
    }
    await load()
    setSaving(false)
  }

  const saveMetaEdit = async () => {
    if (!metaEdit || !sheet) return
    if (!metaEdit.trackTitle.trim()) { showToast('שם היצירה חובה', 'error'); return }
    await updateSplitSheetMeta(sheet.id, {
      track_title: metaEdit.trackTitle.trim(),
      isrc: metaEdit.isrc.trim() || null,
      iswc: metaEdit.iswc.trim() || null,
    })
    setMetaEdit(null)
    showToast('פרטי היצירה עודכנו', 'success')
    await load()
  }

  const myEntry = sheet?.participants.find(p => p.user_id === currentUser?.id)
  const iAmSigned = myEntry?.has_signed ?? false
  const iAmParticipant = !!myEntry

  const displayRows = editing && draft ? draft : catParticipants

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!sheet) return <div className="p-8 text-text-muted text-center">שגיאה בטעינת ה-Split Sheet</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 print:max-w-none print:py-0 print:px-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted print:hidden">
        <Link href="/rooms" className="hover:text-text-primary transition-colors">חדרים</Link>
        <ChevronRight size={14} />
        <Link href={`/rooms/${id}`} className="hover:text-text-primary transition-colors">{roomName}</Link>
        <ChevronRight size={14} />
        <span className="text-text-primary">Split Sheet</span>
      </div>

      {/* Header */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-purple" />
          <span className="text-xs text-purple font-semibold">Rights Protection · FlowRoom</span>
        </div>
        <h1 className="text-2xl font-bold">Split Sheet</h1>
        <p className="text-text-secondary text-sm mt-1">
          הסכם חלוקת זכויות לפי שלוש קטגוריות — זה המסמך שמגן על הכסף שלך מול אקו"ם, הפיל ואשכולות.
        </p>
      </div>

      {/* Track meta */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-5 mb-6 print:mb-4 print:shadow-none print:border print:border-gray-300">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted mb-1">שם היצירה</p>
            <h2 className="font-bold text-lg truncate">{sheet.track_title}</h2>
          </div>
          {!locked && (
            <button onClick={() => setMetaEdit({ trackTitle: sheet.track_title, isrc: sheet.isrc ?? '', iswc: sheet.iswc ?? '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all print:hidden">
              <PenLine size={12} /> ערוך פרטים
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><p className="text-xs text-text-muted mb-0.5">ISRC</p>
            <p className="text-sm font-mono">{sheet.isrc || <span className="text-text-muted">—</span>}</p></div>
          <div><p className="text-xs text-text-muted mb-0.5">ISWC</p>
            <p className="text-sm font-mono">{sheet.iswc || <span className="text-text-muted">—</span>}</p></div>
          <div><p className="text-xs text-text-muted mb-0.5">גרסה</p>
            <p className="text-sm font-mono">v{sheet.version}</p></div>
          <div><p className="text-xs text-text-muted mb-0.5">סטטוס</p>
            {locked ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><Lock size={11} /> נעול</span>
            ) : allSigned ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 size={11} /> נחתם</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning"><AlertCircle size={11} /> ממתין</span>
            )}
          </div>
        </div>
      </div>

      {/* Global status banner */}
      {locked ? (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-2xl mb-6 print:hidden">
          <BadgeCheck size={18} className="text-success flex-shrink-0" />
          <div className="flex-1">
            <p className="text-success font-semibold text-sm">Split Sheet נעול ומחייב</p>
            <p className="text-success/70 text-xs mt-0.5">
              ננעל ב-{sheet.locked_at ? new Date(sheet.locked_at).toLocaleDateString('he-IL') : '—'}. זהו המקור הרשמי לחלוקת תמלוגים.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-2xl mb-6 print:hidden">
          <AlertCircle size={18} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-warning font-semibold text-sm">{all100 ? 'ממתין לחתימות' : 'חלוקות לא שלמות'}</p>
            <p className="text-warning/70 text-xs mt-0.5">
              {all100
                ? 'כל הקטגוריות מסתכמות ב־100%. חתימת כל הצדדים תנעל את ה־Split Sheet.'
                : 'אחת או יותר מהקטגוריות לא מסתכמות ב־100%.'}
            </p>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 bg-bg1 rounded-2xl shadow-surface p-1 mb-4 print:hidden">
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat]
          const catParts = sheet.participants.filter(p => p.category === cat)
          const catTotal = catParts.reduce((s, p) => s + Number(p.share_pct), 0)
          const catSigned = catParts.length > 0 && catParts.every(p => p.has_signed)
          const Icon = meta.icon
          return (
            <button key={cat} onClick={() => { cancelEditing(); setActiveCat(cat) }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all
                ${activeCat === cat ? 'bg-brand-gradient text-white shadow-glow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
              <div className="flex items-center gap-1.5"><Icon size={13} /><span>{meta.label}</span></div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono ${activeCat === cat ? 'text-white/90' : Math.round(catTotal) === 100 ? 'text-success' : 'text-danger'}`}>
                  {Math.round(catTotal)}%
                </span>
                {catSigned && <CheckCircle2 size={11} className={activeCat === cat ? 'text-white' : 'text-success'} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Category info */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-4 mb-4 print:hidden">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-bg3 flex-shrink-0 ${CATEGORY_META[activeCat].bodyColor}`}>
            {(() => { const Icon = CATEGORY_META[activeCat].icon; return <Icon size={18} /> })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{CATEGORY_META[activeCat].label}</h3>
              <span className="text-xs text-text-muted">{CATEGORY_META[activeCat].sublabel}</span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{CATEGORY_META[activeCat].description}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-bg3 border border-border rounded-lg px-2.5 py-1">
              <span className="text-text-muted">נאסף על ידי:</span>
              <span className={`font-semibold ${CATEGORY_META[activeCat].bodyColor}`}>{CATEGORY_META[activeCat].body}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden mb-6 print:hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-purple" />
            <h2 className="font-semibold">חלוקה</h2>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-mono font-bold ml-1 ${Math.round(total) === 100 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
              {Math.round(total)}%
            </span>
          </div>
          {locked ? (
            <span className="flex items-center gap-1.5 text-xs text-text-muted"><Lock size={12} /> נעול</span>
          ) : !editing ? (
            <button onClick={startEditing}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
              <PenLine size={13} /> ערוך
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancelEditing}
                className="px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors">
                ביטול
              </button>
              <button onClick={saveDraft} disabled={saving}
                className="px-3 py-1.5 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? '...' : 'שמור'}
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {displayRows.map(p => {
            const profile = p.profile
            const isMe = currentUser?.id === p.user_id
            const catMeta = CATEGORY_META[activeCat]
            const hasSignedVal = editing ? false : ('has_signed' in p ? (p as DbSplitParticipant).has_signed : false)
            const signedAt = 'signed_at' in p ? (p as DbSplitParticipant).signed_at : null

            return (
              <div key={p.user_id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar user={profileToUser(profile)} size="md" showOnline />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{profile.display_name}</span>
                      {isMe && <span className="text-xs text-purple bg-purple/10 px-1.5 py-0.5 rounded">אתה</span>}
                      {!editing && hasSignedVal && (
                        <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                          ✓ חתום {signedAt ? `· ${new Date(signedAt).toLocaleDateString('he-IL')}` : ''}
                        </span>
                      )}
                    </div>
                    {editing ? (
                      <select value={p.role ?? ''} onChange={e => updateDraft(p.user_id, { role: e.target.value })}
                        className="mt-1 bg-bg3 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-purple cursor-pointer">
                        {catMeta.roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    ) : (
                      <p className="text-text-muted text-xs">
                        {catMeta.roles.find(r => r.value === p.role)?.label ?? p.role ?? '—'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple font-bold text-xl">{Number(p.share_pct)}%</span>
                    {editing && (
                      <button onClick={() => removeDraft(p.user_id)}
                        className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {editing ? (
                  <input type="range" min={0} max={100} step={1} value={Number(p.share_pct)}
                    onChange={e => updateDraft(p.user_id, { share_pct: Number(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to left, #a855f7 ${Number(p.share_pct)}%, var(--bg3) ${Number(p.share_pct)}%)` }} />
                ) : (
                  <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${Number(p.share_pct)}%` }} />
                  </div>
                )}
              </div>
            )
          })}

          {editing && (
            <div className="p-5">
              <p className="text-xs text-text-muted mb-2">הוסף משתתף לקטגוריה זו:</p>
              <div className="relative mb-2">
                <Search size={13} className="absolute top-1/2 -translate-y-1/2 right-3 text-text-muted" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="חפש לפי שם..."
                  className="w-full bg-bg3 border border-border rounded-xl pr-8 pl-3 py-2 text-xs focus:outline-none focus:border-purple" />
              </div>
              {searchResults.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => addDraftParticipant(u)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs hover:border-purple/40 transition-all">
                      <Plus size={11} />{u.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 p-4 bg-bg2/60 border-t border-border">
          <Info size={13} className="text-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            כל שינוי בחלוקה מבטל חתימות קודמות באותה קטגוריה ודורש חתימה מחדש.
          </p>
        </div>
      </div>

      {/* Sign button — only for participants who haven't signed */}
      {!locked && iAmParticipant && !iAmSigned && (
        <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
          <button onClick={handleSign} disabled={!all100 || saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm">
            <PenLine size={15} />
            {saving ? 'שומר...' : 'חתום על כל הקטגוריות'}
          </button>
          <span className="text-xs text-text-muted">חתימה אלקטרונית אחת מאשרת את כל הקטגוריות בהן אתה מופיע.</span>
        </div>
      )}
      {!locked && iAmSigned && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-success/10 border border-success/30 rounded-xl print:hidden">
          <CheckCircle2 size={15} className="text-success flex-shrink-0" />
          <p className="text-xs text-success">חתמת. ממתין לחתימות שאר המשתתפים.</p>
        </div>
      )}

      {/* Contract preview */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-6 mb-6 print:shadow-none print:border print:border-gray-300">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-purple" />
            <h2 className="font-semibold">תצוגת החוזה</h2>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
            <Printer size={13} />ייצא PDF / הדפס
          </button>
        </div>
        <ContractPreview sheet={sheet} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <Link href={`/rooms/${id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={15} />חזרה לחדר
        </Link>
      </div>

      {/* Meta edit modal */}
      {metaEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 modal-backdrop print:hidden"
          onClick={() => setMetaEdit(null)}>
          <div className="bg-bg1 rounded-2xl w-full max-w-md modal-card p-6"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}>
            <h3 className="font-bold text-lg mb-4">פרטי היצירה</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">שם היצירה *</label>
                <input value={metaEdit.trackTitle} onChange={e => setMetaEdit({ ...metaEdit, trackTitle: e.target.value })}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">ISRC <span className="text-text-muted">— קוד ההקלטה (מהדיסטריביוטור)</span></label>
                <input value={metaEdit.isrc} onChange={e => setMetaEdit({ ...metaEdit, isrc: e.target.value })}
                  placeholder="ISRAA2512345"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">ISWC <span className="text-text-muted">— קוד היצירה (מאקו"ם)</span></label>
                <input value={metaEdit.iswc} onChange={e => setMetaEdit({ ...metaEdit, iswc: e.target.value })}
                  placeholder="T-123.456.789-0"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMetaEdit(null)}
                className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all">ביטול</button>
              <button onClick={saveMetaEdit}
                className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Contract preview ────────────────────────────────────────────────────── */
function ContractPreview({ sheet }: { sheet: FullSplitSheet }) {
  const renderCategory = (cat: SplitCategory) => {
    const meta = CATEGORY_META[cat]
    const items = sheet.participants.filter(p => p.category === cat)
    const total = items.reduce((s, p) => s + Number(p.share_pct), 0)
    return (
      <div key={cat} className="mb-5 last:mb-0">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border">
          <div>
            <span className="font-semibold text-sm">{meta.label}</span>
            <span className="text-text-muted text-xs mr-2">· {meta.sublabel} · נאסף על ידי {meta.body}</span>
          </div>
          <span className={`text-xs font-mono font-bold ${Math.round(total) === 100 ? 'text-success' : 'text-danger'}`}>
            {Math.round(total)}%
          </span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted">
              <th className="text-right py-1.5 font-medium">שם</th>
              <th className="text-right py-1.5 font-medium">תפקיד</th>
              <th className="text-right py-1.5 font-medium">חלק</th>
              <th className="text-right py-1.5 font-medium">חתימה</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => {
              const roleLabel = CATEGORY_META[cat].roles.find(r => r.value === p.role)?.label ?? p.role ?? '—'
              return (
                <tr key={p.user_id} className="border-t border-border/50">
                  <td className="py-2 text-text-primary">{p.profile.display_name}</td>
                  <td className="py-2 text-text-secondary">{roleLabel}</td>
                  <td className="py-2 font-mono font-semibold">{Number(p.share_pct)}%</td>
                  <td className="py-2">
                    {p.has_signed
                      ? <span className="text-success text-xs">✓ נחתם דיגיטלית · {p.signed_at ? new Date(p.signed_at).toLocaleDateString('he-IL') : ''}</span>
                      : <span className="text-text-muted text-xs">— ממתין —</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="text-sm leading-relaxed">
      <div className="text-center mb-5 pb-4 border-b border-border">
        <p className="text-xs text-text-muted">הסכם חלוקת זכויות · SPLIT SHEET</p>
        <h3 className="font-bold text-xl mt-1">{sheet.track_title}</h3>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-text-muted">
          {sheet.isrc && <span>ISRC: <span className="font-mono text-text-primary">{sheet.isrc}</span></span>}
          {sheet.iswc && <span>ISWC: <span className="font-mono text-text-primary">{sheet.iswc}</span></span>}
          <span>גרסה: <span className="font-mono text-text-primary">v{sheet.version}</span></span>
          <span>נוצר: <span className="text-text-primary">{new Date(sheet.created_at).toLocaleDateString('he-IL')}</span></span>
        </div>
      </div>

      {CATEGORIES.map(renderCategory)}

      <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary leading-loose">
        <p className="font-semibold mb-1">תנאים:</p>
        <p>1. חלוקת התמלוגים הבאה תחול על כל ההכנסות מהיצירה הנ"ל — ביצוע ציבורי, שכפול, שידור, סטרימינג, סינכרון ולייב.</p>
        <p>2. הצדדים מתחייבים לרשום את היצירה באקו"ם, הפיל ואשכולות בהתאם לחלוקה שלעיל.</p>
        <p>3. שינוי חלוקה מחייב הסכמה בכתב מכל הצדדים המפורטים.</p>
        <p>4. מסמך זה נחתם דיגיטלית ב־FlowRoom ומשמש ראיה משפטית לחלוקת הזכויות.</p>
      </div>

      {sheet.status === 'locked' && (
        <div className="mt-4 pt-3 border-t border-border text-center text-xs">
          <p className="text-success font-semibold">🔒 המסמך נעול · {sheet.locked_at ? new Date(sheet.locked_at).toLocaleDateString('he-IL') : ''}</p>
          <p className="text-text-muted mt-1">FlowRoom Rights Protection · ID: {sheet.id}</p>
        </div>
      )}

      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
        <p className="text-xs font-semibold mb-3">אישור חתימות:</p>
        <div className="grid grid-cols-2 gap-4">
          {[...new Set(sheet.participants.map(p => p.user_id))].map(uid => {
            const part = sheet.participants.find(p => p.user_id === uid)
            return (
              <div key={uid} className="border-t border-gray-400 pt-1">
                <p className="text-xs">{part?.profile.display_name}</p>
                <p className="text-[10px] text-gray-500">חתימה / תאריך</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
