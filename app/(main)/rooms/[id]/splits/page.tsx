'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import { ArrowLeft, ChevronRight, PenLine, CheckCircle2, AlertCircle, Sliders, FileText, Info } from 'lucide-react'

export default function SplitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { rooms, signSplit, showToast, currentUser } = useStore()
  const room = rooms.find(r => r.id === id)
  const [editing, setEditing] = useState(false)
  const [splits, setSplits] = useState<Record<string, number>>({})

  if (!room) return <div className="p-8 text-text-muted text-center">החדר לא נמצא</div>

  const totalSplit = room.members.reduce((sum, m) => sum + m.split, 0)
  const effectiveSplits = editing ? splits : Object.fromEntries(room.members.map(m => [m.userId, m.split]))
  const editTotal = Object.values(effectiveSplits).reduce((s, v) => s + v, 0)
  const allSigned = room.members.every(m => m.hasSigned)

  const startEditing = () => {
    setSplits(Object.fromEntries(room.members.map(m => [m.userId, m.split])))
    setEditing(true)
  }

  const handleSave = () => {
    if (Math.round(editTotal) !== 100) {
      showToast('סך הפיצולים חייב להיות 100%', 'error')
      return
    }
    showToast('הפיצולים עודכנו — ממתין לחתימות מחדש', 'info')
    setEditing(false)
  }

  const handleSign = (userId: string) => {
    signSplit(room.id, userId)
    showToast('חתמת על החוזה בהצלחה!', 'success')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Link href="/rooms" className="hover:text-text-primary transition-colors">חדרים</Link>
        <ChevronRight size={14} />
        <Link href={`/rooms/${id}`} className="hover:text-text-primary transition-colors">{room.name}</Link>
        <ChevronRight size={14} />
        <span className="text-text-primary">Splits</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">חלוקת זכויות</h1>
        <p className="text-text-secondary text-sm mt-1">קבע את אחוזי הבעלות וחתום על החוזה</p>
      </div>

      {/* Status banner */}
      {allSigned ? (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-2xl mb-6">
          <CheckCircle2 size={18} className="text-success flex-shrink-0" />
          <div>
            <p className="text-success font-semibold text-sm">החוזה נחתם על ידי כולם</p>
            <p className="text-success/70 text-xs mt-0.5">חלוקת הזכויות הושלמה ומחייבת</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-2xl mb-6">
          <AlertCircle size={18} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-warning font-semibold text-sm">ממתין לחתימות</p>
            <p className="text-warning/70 text-xs mt-0.5">{room.members.filter(m => !m.hasSigned).length} חברים טרם חתמו</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-bg1 rounded-2xl shadow-surface overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-purple" />
            <h2 className="font-semibold">פיצולים</h2>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-mono font-bold ml-1 ${Math.round(editTotal) === 100 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
              {Math.round(editTotal)}%
            </span>
          </div>
          {!editing ? (
            <button onClick={startEditing}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
              <PenLine size={13} />
              ערוך
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="px-3 py-1.5 bg-bg3 border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors">
                ביטול
              </button>
              <button onClick={handleSave}
                className="px-3 py-1.5 bg-brand-gradient rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                שמור
              </button>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="divide-y divide-border">
          {room.members.map(m => {
            const u = getUserById(m.userId)
            if (!u) return null
            const val = effectiveSplits[m.userId] ?? m.split
            const isMe = currentUser?.id === m.userId

            return (
              <div key={m.userId} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar user={u} size="md" showOnline />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{u.name}</span>
                      {isMe && <span className="text-xs text-purple bg-purple/10 px-1.5 py-0.5 rounded">אתה</span>}
                      {m.hasSigned && <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">✓ חתום</span>}
                    </div>
                    <p className="text-text-muted text-xs">{m.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-purple font-bold text-xl">{val}%</span>
                  </div>
                </div>

                {/* Slider */}
                {editing ? (
                  <input
                    type="range" min={0} max={100} step={1}
                    value={val}
                    onChange={e => setSplits(prev => ({ ...prev, [m.userId]: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to left, #a855f7 ${val}%, #232338 ${val}%)`
                    }}
                  />
                ) : (
                  <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${val}%` }} />
                  </div>
                )}

                {/* Sign button */}
                {!m.hasSigned && isMe && !editing && (
                  <button onClick={() => handleSign(m.userId)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium hover:bg-success/20 transition-colors">
                    <PenLine size={14} />
                    חתום על החוזה
                  </button>
                )}
                {!m.hasSigned && !isMe && !editing && (
                  <p className="mt-2 text-xs text-text-muted">ממתין לחתימת {u.name}...</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Info footer */}
        <div className="flex items-start gap-2 p-4 bg-bg2/60 border-t border-border">
          <Info size={13} className="text-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            כל שינוי בפיצולים מחייב חתימה מחדש מכל החברים. הסכם זה מסדיר את חלוקת התמלוגים ממכירות ושימושים עתידיים.
          </p>
        </div>
      </div>

      {/* Contract preview */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-purple" />
          <h2 className="font-semibold">תצוגה מקדימה של החוזה</h2>
        </div>
        <div className="bg-bg3 rounded-xl p-4 font-mono text-xs text-text-secondary leading-loose">
          <p className="text-text-muted mb-2">// הסכם שיתוף יצירה — FlowRoom</p>
          <p>פרויקט: <span className="text-purple">{room.name}</span></p>
          <p>תאריך: <span className="text-text-primary">{room.createdAt}</span></p>
          <p className="mt-2 mb-1 text-text-muted">// חלוקת זכויות</p>
          {room.members.map(m => {
            const u = getUserById(m.userId)
            return (
              <p key={m.userId}>{u?.name}: <span className="text-success">{m.split}%</span>{m.hasSigned ? ' ✓' : ' ⏳'}</p>
            )
          })}
          <p className="mt-2 text-text-muted">// תנאים</p>
          <p>כל ההכנסות מהשיר יחולקו לפי האחוזים המפורטים לעיל.</p>
          <p>שינוי חלוקה מחייב הסכמת כלל החברים.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/rooms/${id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={15} />
          חזרה לחדר
        </Link>
        {allSigned && (
          <button onClick={() => showToast('החוזה יוצא לאישור חיצוני', 'info')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            <FileText size={15} />
            ייצא PDF
          </button>
        )}
      </div>
    </div>
  )
}
