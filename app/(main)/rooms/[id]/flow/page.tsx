'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STAGES } from '@/lib/data'
import * as db from '@/lib/db'
import type { DbRoom, DbRoomTask } from '@/lib/supabase-types'
import { CheckCircle2, ArrowRight, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'

type Task = DbRoomTask & { stage: number }

export default function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useStore()

  const [room,    setRoom]    = useState<DbRoom | null>(null)
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    Promise.all([db.getRoomById(id), db.getRoomTasks(id)])
      .then(([r, t]) => {
        if (!r) { router.push('/rooms'); return }
        setRoom(r)
        setTasks(t as Task[])
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleAdvance = async () => {
    if (!room || advancing) return
    setAdvancing(true)
    await db.advanceRoomStage(id, room.current_stage)
    setRoom(prev => prev ? { ...prev, current_stage: prev.current_stage + 1 } : prev)
    showToast('מעבר לשלב הבא!', 'success')
    setAdvancing(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-purple" />
      </div>
    )
  }

  if (!room) return null

  const currentTasks = tasks.filter(t => t.stage === room.current_stage)
  const allDone = currentTasks.length > 0 && currentTasks.every(t => t.done)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Link href="/rooms" className="hover:text-text-primary transition-colors">חדרים</Link>
        <ChevronRight size={14} />
        <Link href={`/rooms/${id}`} className="hover:text-text-primary transition-colors">{room.name}</Link>
        <ChevronRight size={14} />
        <span className="text-text-primary">Flow</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">ניהול תהליך העבודה</h1>
        <p className="text-text-secondary text-sm mt-1">{room.name} · שלב {room.current_stage + 1} מתוך {STAGES.length}</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute right-6 top-6 bottom-6 w-0.5 bg-border" />

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone    = i < room.current_stage
            const isCurrent = i === room.current_stage
            const isUpcoming = i > room.current_stage
            const stageTasks = tasks.filter(t => t.stage === i)
            const stageDone  = stageTasks.filter(t => t.done).length

            return (
              <div key={stage.id} className="flex gap-6">
                {/* Node */}
                <div className="relative z-10 flex-shrink-0">
                  {isDone ? (
                    <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shadow-glow">
                      <span className="text-white font-bold">{i + 1}</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-bg3 border-2 border-border flex items-center justify-center">
                      <span className="text-text-muted text-sm">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Card */}
                <div className={`flex-1 rounded-2xl border p-5 mb-2 transition-all ${
                  isDone    ? 'bg-bg1 border-border opacity-70'
                  : isCurrent ? 'bg-bg2 border-purple/40 shadow-glow-sm'
                  : 'bg-bg1 border-border'
                }`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className={`font-semibold ${isDone ? 'text-text-secondary' : isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                        {stage.name}
                      </h3>
                      <p className="text-text-muted text-sm mt-0.5">{stage.sub}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {stageTasks.length > 0 && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg border ${
                          isCurrent ? 'bg-purple/10 text-purple border-purple/30' : 'bg-bg3 text-text-muted border-border'
                        }`}>
                          {stageDone}/{stageTasks.length} משימות
                        </span>
                      )}
                      {isDone   && <span className="text-xs px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-lg">הושלם</span>}
                      {isUpcoming && <span className="text-xs px-2.5 py-1 bg-bg3 text-text-muted border border-border rounded-lg">בקרוב</span>}
                    </div>
                  </div>

                  {isCurrent && stageTasks.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-text-muted">התקדמות</span>
                        <span className="text-xs text-purple">{Math.round((stageDone / stageTasks.length) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-gradient rounded-full transition-all"
                          style={{ width: `${(stageDone / stageTasks.length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex items-center justify-between p-5 bg-bg1 rounded-2xl shadow-surface flex-wrap gap-4">
        <div>
          <p className="font-semibold">שלב נוכחי: {STAGES[room.current_stage]?.name}</p>
          <p className="text-text-muted text-sm mt-0.5">
            {allDone
              ? 'כל המשימות הושלמו — מוכן לעבור לשלב הבא'
              : `${currentTasks.filter(t => t.done).length}/${currentTasks.length} משימות הושלמו`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/rooms/${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft size={15} />חזרה לחדר
          </Link>
          {room.current_stage < STAGES.length - 1 && (
            <button onClick={handleAdvance} disabled={!allDone || advancing}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              {advancing ? <Loader2 size={14} className="animate-spin" /> : null}
              עבור לשלב הבא
              <ArrowRight size={15} />
            </button>
          )}
          {room.current_stage === STAGES.length - 1 && (
            <button onClick={() => showToast('השיר שוחרר! 🎉', 'success')}
              className="flex items-center gap-2 px-4 py-2.5 bg-success/20 border border-success/40 rounded-xl text-sm font-semibold text-success hover:bg-success/30 transition-colors">
              שחרר!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
