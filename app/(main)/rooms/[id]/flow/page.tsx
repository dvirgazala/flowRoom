'use client'
import { use } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { STAGES } from '@/lib/data'
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react'

export default function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { rooms, advanceStage, showToast } = useStore()
  const room = rooms.find(r => r.id === id)

  if (!room) return <div className="p-8 text-text-muted text-center">החדר לא נמצא</div>

  const currentTasks = room.tasks.filter(t => t.stage === room.currentStage)
  const allDone = currentTasks.length > 0 && currentTasks.every(t => t.done)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Link href="/rooms" className="hover:text-text-primary transition-colors">חדרים</Link>
        <ChevronRight size={14} />
        <Link href={`/rooms/${id}`} className="hover:text-text-primary transition-colors">{room.name}</Link>
        <ChevronRight size={14} />
        <span className="text-text-primary">Flow</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">ניהול תהליך העבודה</h1>
        <p className="text-text-secondary text-sm mt-1">{room.name} · שלב {room.currentStage + 1} מתוך {STAGES.length}</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute right-6 top-6 bottom-6 w-0.5 bg-border" />

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone = i < room.currentStage
            const isCurrent = i === room.currentStage
            const isUpcoming = i > room.currentStage
            const stageTasks = room.tasks.filter(t => t.stage === i)
            const stageDone = stageTasks.filter(t => t.done).length

            return (
              <div key={stage.id} className={`flex gap-6 transition-all`}>
                {/* Node */}
                <div className="relative z-10 flex-shrink-0">
                  {isDone ? (
                    <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shadow-glow ring-pulse">
                      <span className="text-white font-bold">{i + 1}</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-bg3 border-2 border-border flex items-center justify-center">
                      <span className="text-text-muted text-sm">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Card */}
                <div className={`flex-1 rounded-2xl border p-5 mb-2 transition-all
                  ${isDone ? 'bg-bg1 border-border opacity-70' : isCurrent ? 'bg-bg2 border-purple/40 shadow-glow-sm' : 'bg-bg1 border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${isDone ? 'text-text-secondary' : isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                        {stage.name}
                      </h3>
                      <p className="text-text-muted text-sm mt-0.5">{stage.sub}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {stageTasks.length > 0 && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg border ${isCurrent ? 'bg-purple/10 text-purple border-purple/30' : 'bg-bg3 text-text-muted border-border'}`}>
                          {stageDone}/{stageTasks.length} משימות
                        </span>
                      )}
                      {isDone && (
                        <span className="text-xs px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-lg">הושלם</span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs px-2.5 py-1 bg-bg3 text-text-muted border border-border rounded-lg">בקרוב</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for current */}
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
      <div className="mt-8 flex items-center justify-between p-5 bg-bg1 rounded-2xl shadow-surface">
        <div>
          <p className="font-semibold">שלב נוכחי: {STAGES[room.currentStage].name}</p>
          <p className="text-text-muted text-sm mt-0.5">
            {allDone ? 'כל המשימות הושלמו — מוכן לעבור לשלב הבא' : `${currentTasks.filter(t => t.done).length}/${currentTasks.length} משימות הושלמו`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/rooms/${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft size={15} />
            חזרה לחדר
          </Link>
          {room.currentStage < 6 && (
            <button onClick={() => advanceStage(room.id)} disabled={!allDone}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              עבור לשלב הבא
              <ArrowRight size={15} />
            </button>
          )}
          {room.currentStage === 6 && (
            <button onClick={() => showToast('השיר שוחרר! 🎉', 'success')}
              className="flex items-center gap-2 px-4 py-2.5 bg-success/20 border border-success/40 rounded-xl text-sm font-semibold text-success hover:bg-success/30 transition-colors">
              🚀 שחרר!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
