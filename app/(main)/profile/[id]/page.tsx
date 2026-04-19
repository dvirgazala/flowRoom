'use client'
import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { USERS, getUserById } from '@/lib/data'
import Avatar from '@/components/Avatar'
import AudioPlayer from '@/components/AudioPlayer'
import VerifiedBadge from '@/components/VerifiedBadge'
import DmChatModal from '@/components/DmChatModal'
import type { MediaItem } from '@/lib/types'
import {
  MapPin, Music2, Star, Users, MessageCircle, Share2, Zap, Trophy, Clock, Play,
  Image as ImageIcon, Video, Film, Heart, Eye, Upload, X, Plus,
  ChevronLeft, ChevronRight, Download, MoreHorizontal,
} from 'lucide-react'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentUser, showToast, users } = useStore()
  const user = users.find(u => u.id === id) || getUserById(id) || USERS[0]
  const [activeTab, setActiveTab] = useState<'portfolio' | 'media' | 'collabs' | 'about'>('portfolio')
  const [dmOpen, setDmOpen] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(user.media ?? [])
  const [lightbox, setLightbox] = useState<{ item: MediaItem; index: number } | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'reel'>('all')

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    // Keep scroll anchored to the tabs row instead of letting the browser snap
    // when content height changes drastically between tabs.
    requestAnimationFrame(() => {
      const el = tabsRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top, behavior: 'auto' })
    })
  }

  const isMe = currentUser?.id === user.id

  const stats = [
    { label: 'שירים',    value: user.songs },
    { label: 'שיתופים', value: user.collabs },
    { label: 'עוקבים',  value: user.followers },
    { label: 'דירוג',   value: user.rating.toFixed(1) },
  ]

  const filteredMedia = mediaFilter === 'all' ? mediaItems : mediaItems.filter(m => m.type === mediaFilter)

  const openLightbox = (item: MediaItem) => {
    const index = filteredMedia.findIndex(m => m.id === item.id)
    setLightbox({ item, index })
  }
  const lightboxNav = (dir: 1 | -1) => {
    if (!lightbox) return
    const next = (lightbox.index + dir + filteredMedia.length) % filteredMedia.length
    setLightbox({ item: filteredMedia[next], index: next })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {dmOpen && <DmChatModal userId={user.id} onClose={() => setDmOpen(false)} />}
      {lightbox && (
        <MediaLightbox
          item={lightbox.item}
          total={filteredMedia.length}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={lightboxNav}
          onLike={() => {
            setMediaItems(prev => prev.map(m => m.id === lightbox.item.id ? { ...m, likes: m.likes + 1 } : m))
            setLightbox(prev => prev ? { ...prev, item: { ...prev.item, likes: prev.item.likes + 1 } } : null)
          }}
        />
      )}
      {showUpload && (
        <UploadMediaModal
          onClose={() => setShowUpload(false)}
          onUpload={(item) => {
            setMediaItems(prev => [item, ...prev])
            setShowUpload(false)
            setActiveTab('media')
            showToast('המדיה פורסמה בהצלחה! 🎉', 'success')
          }}
          userId={user.id}
        />
      )}

      {/* Cover / Hero */}
      <div className="relative bg-bg1 rounded-2xl shadow-surface overflow-hidden mb-6">
        <div className="h-36 w-full" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.15), #0d0d22 80%)' }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="ring-4 ring-bg1 rounded-full">
              <Avatar user={user} size="xl" showOnline />
            </div>
            <div className="flex items-center gap-2 pb-1">
              {isMe ? (
                <>
                  <button onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple/15 border border-purple/30 text-purple rounded-xl text-sm hover:bg-purple/25 transition-all">
                    <Upload size={14} />
                    העלה מדיה
                  </button>
                  <Link href="/settings"
                    className="px-4 py-2 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
                    הגדרות
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={() => showToast('בקשת שיתוף פעולה נשלחה!', 'success')}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-glow-sm">
                    <Zap size={14} />
                    שתף פעולה
                  </button>
                  <button onClick={() => showToast('עוקב!', 'success')}
                    className="px-4 py-2 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/40 active:scale-95 transition-all">
                    עקוב
                  </button>
                  <button onClick={() => setDmOpen(true)}
                    className="p-2.5 bg-bg3 border border-border rounded-xl text-text-secondary hover:text-purple hover:border-purple/40 active:scale-95 transition-all"
                    title="שלח הודעה">
                    <MessageCircle size={16} />
                  </button>
                </>
              )}
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('הקישור הועתק', 'info') }}
                className="p-2.5 bg-bg3 border border-border rounded-xl text-text-secondary hover:text-text-primary active:scale-95 transition-all">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{user.name}</h1>
              {user.isVerified && <VerifiedBadge size={18} />}
            </div>
            <p className="text-text-secondary text-sm mt-0.5">{user.role}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-text-muted text-xs"><MapPin size={12} />{user.location}</span>
              <span className="flex items-center gap-1 text-success text-xs font-medium"><Trophy size={12} />Trust {user.trustScore}</span>
              <span className="flex items-center gap-1 text-text-muted text-xs"><Clock size={12} />הצטרף {user.joinedAt}</span>
            </div>
            {user.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {user.genres.map(g => (
                  <span key={g} className="text-xs px-2.5 py-1 bg-purple/10 text-purple border border-purple/20 rounded-lg">{g}</span>
                ))}
              </div>
            )}
          </div>

          <p className="text-text-secondary text-sm leading-relaxed mb-4">{user.bio}</p>

          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-bold text-lg">{value}</p>
                <p className="text-text-muted text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion bar */}
      <div className="bg-bg1 rounded-2xl shadow-surface p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">אמינות</span>
          <span className="text-xs text-purple font-medium">{user.completionRate}% השלמת פרויקטים</span>
        </div>
        <div className="h-2 bg-bg3 rounded-full overflow-hidden">
          <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${user.completionRate}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-warning fill-warning" />
            <span className="text-sm font-medium">{user.rating}</span>
            <span className="text-text-muted text-xs">(דירוג)</span>
          </div>
          {user.warnings > 0 && <span className="text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded">{user.warnings} אזהרה</span>}
          {user.isSuspended && <span className="text-xs text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded">מושהה</span>}
        </div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="flex gap-1 bg-bg1 rounded-2xl shadow-surface p-1 mb-6 overflow-x-auto">
        {([
          ['portfolio', 'תיק עבודות'],
          ['media', `מדיה ${mediaItems.length > 0 ? `(${mediaItems.length})` : ''}`],
          ['collabs', 'שיתופי פעולה'],
          ['about', 'אודות'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab ? 'bg-brand-gradient text-white shadow-glow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Portfolio ──────────────────────────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-3">
          {user.portfolio.length === 0 ? (
            <div className="bg-bg1 rounded-2xl shadow-surface p-8 text-center">
              <Music2 size={32} className="text-text-muted mx-auto mb-2" />
              <p className="text-text-muted text-sm">אין פריטים בתיק העבודות עדיין</p>
            </div>
          ) : user.portfolio.map(item => (
            <div key={item.id} className="bg-bg1 rounded-2xl shadow-surface p-4 hover:shadow-glow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-purple bg-purple/10 px-2 py-0.5 rounded border border-purple/20">{item.genre}</span>
                    <span className="text-xs text-text-muted">{item.bpm} BPM · {item.key} · {item.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs">
                  <Play size={12} />{item.plays.toLocaleString()}
                </div>
              </div>
              <AudioPlayer url={item.audioUrl} compact />
              <p className="text-xs text-text-muted mt-2">{item.createdAt}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Media ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'media' && (
        <div>
          {/* Media filter bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-1.5">
              {([
                ['all', 'הכל', null],
                ['image', 'תמונות', ImageIcon],
                ['video', 'סרטונים', Video],
                ['reel', 'ריילס', Film],
              ] as const).map(([f, label, Icon]) => (
                <button key={f} onClick={() => setMediaFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${mediaFilter === f ? 'bg-purple/20 border-purple text-purple' : 'bg-bg1 border-border text-text-secondary hover:border-purple/40'}`}>
                  {Icon && <Icon size={12} />}
                  {label}
                  {f !== 'all' && <span className="text-text-muted">({mediaItems.filter(m => m.type === f).length})</span>}
                </button>
              ))}
            </div>
            {isMe && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple/15 border border-purple/30 text-purple rounded-lg text-xs font-medium hover:bg-purple/25 transition-all">
                <Plus size={13} />
                העלה
              </button>
            )}
          </div>

          {filteredMedia.length === 0 ? (
            <div className="bg-bg1 rounded-2xl shadow-surface p-12 text-center">
              <ImageIcon size={36} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm mb-4">
                {isMe ? 'עוד לא העלית מדיה' : 'אין מדיה להצגה'}
              </p>
              {isMe && (
                <button onClick={() => setShowUpload(true)}
                  className="px-5 py-2.5 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-glow-sm">
                  העלה תמונה או סרטון
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredMedia.map(item => (
                <MediaCard key={item.id} item={item} onClick={() => openLightbox(item)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Collabs ───────────────────────────────────────────────────────────── */}
      {activeTab === 'collabs' && (
        <div className="bg-bg1 rounded-2xl shadow-surface p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {USERS.filter(u => u.id !== user.id).slice(0, 6).map(collaborator => (
              <Link key={collaborator.id} href={`/profile/${collaborator.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-bg3 rounded-2xl hover:bg-bg2 transition-colors group">
                <Avatar user={collaborator} size="lg" showOnline />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="font-medium text-sm group-hover:text-purple transition-colors">{collaborator.name}</p>
                    {collaborator.isVerified && <VerifiedBadge size={13} />}
                  </div>
                  <p className="text-text-muted text-xs">{collaborator.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="bg-bg1 rounded-2xl shadow-surface p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-2">ביוגרפיה</h3>
            <p className="text-sm text-text-primary leading-relaxed">{user.bio}</p>
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">סטטיסטיקות</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['תפקיד', user.role], ['מיקום', user.location],
                ['ז\'אנרים', user.genres.join(', ')], ['הצטרף', user.joinedAt],
                ['שיעור השלמה', `${user.completionRate}%`], ['Trust Score', String(user.trustScore)],
              ].map(([label, value]) => (
                <div key={label} className="bg-bg3 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">{label}</p>
                  <p className="text-text-primary text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
          {isMe && (
            <div className="pt-4 border-t border-border">
              <Link href="/settings"
                className="flex items-center justify-center gap-2 w-full py-3 bg-bg3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all">
                ⚙️ הגדרות חשבון, אימות ותשלומים
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Media Card ───────────────────────────────────────────────────────────────

function MediaCard({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const isVertical = item.type === 'reel'
  const TypeIcon = item.type === 'image' ? null : item.type === 'video' ? Video : Film

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl cursor-pointer group bg-bg3 ${isVertical ? 'aspect-[9/16]' : 'aspect-square'}`}
    >
      {/* Thumbnail */}
      <img
        src={item.thumbnail}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Type badge */}
      {TypeIcon && (
        <div className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <TypeIcon size={14} className="text-white" />
        </div>
      )}

      {/* Play overlay for videos/reels */}
      {item.type !== 'image' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play size={20} className="text-white fill-white" />
          </div>
        </div>
      )}

      {/* Hover overlay with stats */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs font-medium line-clamp-1 mb-1">{item.title}</p>
          <div className="flex items-center gap-3 text-white/80 text-xs">
            <span className="flex items-center gap-1"><Heart size={11} />{item.likes}</span>
            <span className="flex items-center gap-1"><Eye size={11} />{item.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Media Lightbox ───────────────────────────────────────────────────────────

function MediaLightbox({ item, total, index, onClose, onNav, onLike }: {
  item: MediaItem; total: number; index: number
  onClose: () => void; onNav: (dir: 1 | -1) => void; onLike: () => void
}) {
  const isVertical = item.type === 'reel'

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={onClose}>

      {/* Nav: prev */}
      {total > 1 && (
        <button onClick={e => { e.stopPropagation(); onNav(-1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
          <ChevronRight size={20} className="text-white" />
        </button>
      )}

      {/* Main content */}
      <div className={`relative flex flex-col ${isVertical ? 'max-w-xs w-full' : 'max-w-2xl w-full'}`} onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            {item.caption && <p className="text-white/60 text-xs mt-0.5">{item.caption}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">{index + 1} / {total}</span>
            <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media */}
        <div className={`relative overflow-hidden rounded-2xl bg-bg0 ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
          {item.type === 'image' ? (
            <img src={item.url || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="relative w-full h-full">
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all">
                  <Play size={28} className="text-white fill-white" />
                </div>
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                {item.type === 'video' ? <Video size={12} className="text-white" /> : <Film size={12} className="text-white" />}
                <span className="text-white text-xs">{item.type === 'video' ? 'וידאו' : 'ריל'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4">
            <button onClick={onLike}
              className="flex items-center gap-1.5 text-white/70 hover:text-pink transition-colors">
              <Heart size={18} />
              <span className="text-sm">{item.likes}</span>
            </button>
            <span className="flex items-center gap-1.5 text-white/40 text-sm">
              <Eye size={16} />
              {item.views.toLocaleString()}
            </span>
          </div>
          <span className="text-white/30 text-xs">{item.createdAt}</span>
        </div>
      </div>

      {/* Nav: next */}
      {total > 1 && (
        <button onClick={e => { e.stopPropagation(); onNav(1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
          <ChevronLeft size={20} className="text-white" />
        </button>
      )}
    </div>
  )
}

// ─── Upload Media Modal ───────────────────────────────────────────────────────

function UploadMediaModal({ onClose, onUpload, userId }: {
  onClose: () => void
  onUpload: (item: MediaItem) => void
  userId: string
}) {
  const [type, setType] = useState<'image' | 'video' | 'reel'>('image')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    if (file.type.startsWith('video/')) setType('video')
    else setType('image')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    setLoading(true)
    const seeds = ['new1', 'new2', 'new3', 'new4', 'new5']
    const seed = seeds[Math.floor(Math.random() * seeds.length)]
    setTimeout(() => {
      const item: MediaItem = {
        id: 'mu-' + Date.now(),
        type,
        url: preview || `https://picsum.photos/seed/${seed}/600/600`,
        thumbnail: preview || (type === 'reel' ? `https://picsum.photos/seed/${seed}/400/700` : `https://picsum.photos/seed/${seed}/400/400`),
        title: title.trim(),
        caption: caption.trim() || undefined,
        likes: 0,
        views: 0,
        createdAt: new Date().toLocaleDateString('he-IL'),
      }
      onUpload(item)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[400] flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-bg1 rounded-2xl w-full max-w-lg modal-card overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 64px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-purple" />
            <p className="font-semibold text-sm">העלאת מדיה</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg3 transition-all"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">סוג מדיה</label>
            <div className="flex gap-2">
              {([['image', 'תמונה', ImageIcon], ['video', 'סרטון', Video], ['reel', 'ריל', Film]] as const).map(([t, label, Icon]) => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${type === t ? 'bg-purple/20 border-purple text-purple' : 'bg-bg3 border-border text-text-secondary hover:border-purple/40'}`}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
              ${dragOver ? 'border-purple bg-purple/10' : 'border-border hover:border-purple/50 hover:bg-purple/5'}
              ${type === 'reel' ? 'aspect-[9/16] max-h-64' : 'aspect-video'}`}
          >
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {preview ? (
              <>
                {type === 'image' || type === 'reel'
                  ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  : <video src={preview} className="w-full h-full object-cover" />
                }
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">לחץ להחלפה</p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
                <Upload size={28} className={dragOver ? 'text-purple' : ''} />
                <p className="text-sm font-medium">{dragOver ? 'שחרר כאן' : 'גרור קובץ או לחץ לבחירה'}</p>
                <p className="text-xs">{type === 'image' ? 'JPG, PNG, WEBP' : 'MP4, MOV, WEBM'}</p>
              </div>
            )}
          </div>

          {/* Title + caption */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">כותרת *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60}
              placeholder="תן שם לפוסט שלך..."
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">כיתוב <span className="text-text-muted">(אופציונלי)</span></label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2} maxLength={200}
              placeholder="ספר משהו על הפוסט..."
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-text-muted" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-bg3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all">
              ביטול
            </button>
            <button onClick={handleSubmit} disabled={!title.trim() || loading}
              className="flex-1 py-3 bg-brand-gradient rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-glow-sm flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />מעלה...</>
                : <><Upload size={14} />פרסם</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
