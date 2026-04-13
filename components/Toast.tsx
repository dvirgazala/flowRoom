'use client'
import { useStore } from '@/lib/store'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export default function Toast() {
  const { toast, clearToast } = useStore()
  if (!toast) return null

  const icons = { success: CheckCircle, error: XCircle, info: Info }
  const colors = {
    success: 'border-success text-success bg-success/10',
    error: 'border-danger text-danger bg-danger/10',
    info: 'border-purple text-purple bg-purple/10',
  }
  const Icon = icons[toast.type]

  return (
    <div className={`toast fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border ${colors[toast.type]} shadow-card backdrop-blur-sm`}>
      <Icon size={18} />
      <span className="text-sm font-medium text-text-primary">{toast.message}</span>
      <button onClick={clearToast} className="opacity-60 hover:opacity-100 transition-opacity mr-1">
        <X size={14} />
      </button>
    </div>
  )
}
