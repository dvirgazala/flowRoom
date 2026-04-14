'use client'
import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase, uploadFile } from '@/lib/supabase'
import { getMyProfile, updateProfile } from '@/lib/db'

const ROLES = ['זמר/ת', 'מפיק/ה', 'כותב/ת', 'נגן/ת', 'מיקס', 'עורך וידאו', 'שיווק']

export default function ProfileCompletionModal({ onDone }: { onDone: () => void }) {
  const showToast = useStore(s => s.showToast)
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)

  const onPickAvatar = (file: File) => {
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { showToast('יש להתחבר מחדש', 'error'); setSaving(false); return }

      const me = await getMyProfile()
      if (!me) { showToast('לא נמצא פרופיל', 'error'); setSaving(false); return }

      let avatarUrl: string | null = me.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${session.user.id}/avatar.${ext}`
        avatarUrl = await uploadFile('avatars', path, avatarFile)
      }

      await updateProfile(session.user.id, {
        avatar_url: avatarUrl,
        role,
        bio,
        location,
        website,
      })

      showToast('הפרופיל עודכן!', 'success')
      onDone()
    } catch (err) {
      console.error(err)
      showToast('שגיאה בשמירה', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-bg1 rounded-2xl shadow-surface-lg w-full max-w-md max-h-[90vh] overflow-y-auto modal-card" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">השלם את הפרופיל</h2>
              <p className="text-text-muted text-sm">כמה פרטים שיעזרו לאחרים להכיר אותך</p>
            </div>
            <button onClick={onDone} className="text-text-muted hover:text-text-primary">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-bg3 border-2 border-dashed border-border hover:border-purple overflow-hidden flex items-center justify-center transition-colors">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} className="text-text-muted" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onPickAvatar(f) }} />
            <p className="text-xs text-text-muted mt-2">תמונת פרופיל</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">אני יוצר/ת —</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${role === r ? 'bg-purple/20 border-purple text-purple' : 'bg-bg3 border-border text-text-secondary hover:border-purple/50'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">ביוגרפיה</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                maxLength={200} placeholder="ספר קצת על עצמך..."
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors resize-none" />
              <p className="text-[10px] text-text-muted mt-1 text-left">{bio.length}/200</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">מיקום</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="תל אביב, ישראל"
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">אתר / קישור (אופציונלי)</label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..." dir="ltr"
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple transition-colors" />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={onDone} disabled={saving}
              className="flex-1 py-3 bg-bg3 hover:bg-bg2 rounded-xl text-sm font-medium text-text-secondary transition-colors disabled:opacity-50">
              דלג
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> שומר...</> : 'שמור והמשך'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
