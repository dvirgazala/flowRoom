'use client'
import { useRef, useState } from 'react'
import { X, ImagePlus, Type, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/supabase'
import { createStory } from '@/lib/db'
import type { StoryWithAuthor } from '@/lib/supabase-types'
import { useStore } from '@/lib/store'

interface Props {
  onClose: () => void
  onCreated: (story: StoryWithAuthor) => void
}

export default function StoryCreator({ onClose, onCreated }: Props) {
  const { currentUser, showToast } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [showText, setShowText] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { showToast('רק תמונות נתמכות כרגע', 'error'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const submit = async () => {
    if (!file || !currentUser) return
    setUploading(true)
    try {
      const path = `stories/${currentUser.id}/${Date.now()}.${file.name.split('.').pop()}`
      const url = await uploadFile('post-media', path, file)
      if (!url) throw new Error('upload failed')
      const story = await createStory(url, text.trim() || undefined)
      if (!story) throw new Error('create failed')
      onCreated(story)
      showToast('הסטורי פורסם!', 'success')
      onClose()
    } catch {
      showToast('שגיאה בפרסום הסטורי', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-bg1 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-surface-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-bold text-base">סטורי חדש</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg3 text-text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Upload area */}
        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="mx-5 mb-4 h-64 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple/50 hover:bg-purple/5 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple/10 flex items-center justify-center">
              <ImagePlus size={26} className="text-purple" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">בחר תמונה לסטורי</p>
              <p className="text-xs text-text-muted mt-0.5">לחץ או גרור תמונה לכאן</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="mx-5 mb-4 relative h-64 rounded-2xl overflow-hidden bg-black">
            <img src={preview} alt="" className="w-full h-full object-contain" />
            {text && (
              <div className="absolute bottom-4 inset-x-4 flex justify-center">
                <div className="bg-black/60 rounded-xl px-4 py-2 text-white text-sm text-center max-w-full">
                  {text}
                </div>
              </div>
            )}
            <button onClick={() => { setPreview(null); setFile(null) }}
              className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Text overlay input */}
        {preview && (
          <div className="px-5 mb-4">
            {showText ? (
              <input
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={80}
                placeholder="הוסף טקסט על הסטורי..."
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors"
              />
            ) : (
              <button onClick={() => setShowText(true)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-purple transition-colors">
                <Type size={15} />
                הוסף טקסט על הסטורי
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            ביטול
          </button>
          <button onClick={submit} disabled={!file || uploading}
            className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {uploading ? <><Loader2 size={15} className="animate-spin" />מפרסם...</> : 'פרסם סטורי'}
          </button>
        </div>
      </div>
    </div>
  )
}
